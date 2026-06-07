package com.yuvraj.service;

import com.razorpay.Order;
import com.razorpay.Refund;
import com.yuvraj.config.RazorpayConfig;
import com.yuvraj.dto.booking.BookingDTOs;
import com.yuvraj.entity.*;
import com.yuvraj.exception.PaymentException;
import com.yuvraj.exception.ResourceNotFoundException;
import com.yuvraj.exception.UnauthorizedException;
import com.yuvraj.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository     bookingRepository;
    private final PaymentRepository     paymentRepository;
    private final UserRepository        userRepository;
    private final PredefinedTripRepository tripRepository;
    private final RazorpayService       razorpayService;
    private final RazorpayConfig        razorpayConfig;

    // =========================================================================
    // STEP 1: Create Booking + Razorpay Order
    // =========================================================================

    /**
     * Creates a PENDING booking and a Razorpay order.
     * The booking is NOT confirmed until payment is verified.
     *
     * Flow:
     *  1. Validate trip exists and is active
     *  2. Calculate total = pricePerPerson × participantCount
     *  3. Create booking record (status = PENDING)
     *  4. Create Razorpay order
     *  5. Save razorpayOrderId on booking
     *  6. Create Payment record (status = PENDING)
     *  7. Return order details to frontend
     */
    @Transactional
    public BookingDTOs.CreateOrderResponse createBookingAndOrder(
            String userEmail, BookingDTOs.CreateBookingRequest request) {

        User user = findUser(userEmail);
        PredefinedTrip trip = tripRepository.findById(request.getPredefinedTripId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Trip not found: " + request.getPredefinedTripId()));

        if (!trip.isActive()) {
            throw new IllegalStateException("This trip is no longer available for booking");
        }

        // Calculate total amount
        BigDecimal totalAmount = trip.getPricePerPerson()
                .multiply(BigDecimal.valueOf(request.getParticipantCount()));

        // Create booking
        Booking booking = Booking.builder()
                .user(user)
                .predefinedTrip(trip)
                .participantCount(request.getParticipantCount())
                .travelDate(request.getTravelDate())
                .totalAmount(totalAmount)
                .bookingStatus(BookingStatus.PENDING)
                .build();

        booking = bookingRepository.save(booking);

        // Create Razorpay order
        String receipt = "booking_" + booking.getId();
        Order razorpayOrder = razorpayService.createOrder(
                totalAmount, razorpayConfig.getCurrency(), receipt);

        String razorpayOrderId = razorpayOrder.get("id");
        booking.setRazorpayOrderId(razorpayOrderId);
        bookingRepository.save(booking);

        // Create payment record (PENDING)
        Payment payment = Payment.builder()
                .booking(booking)
                .razorpayOrderId(razorpayOrderId)
                .amount(totalAmount)
                .currency(razorpayConfig.getCurrency())
                .status(PaymentStatus.PENDING)
                .build();

        paymentRepository.save(payment);

        log.info("Booking {} created with Razorpay order {}", booking.getId(), razorpayOrderId);

        return BookingDTOs.CreateOrderResponse.builder()
                .razorpayOrderId(razorpayOrderId)
                .amount(totalAmount)
                .currency(razorpayConfig.getCurrency())
                .bookingId(booking.getId())
                .keyId(razorpayConfig.getKeyId())   // frontend needs this to init Razorpay SDK
                .build();
    }

    // =========================================================================
    // STEP 2: Verify Payment (called after frontend payment completes)
    // =========================================================================

    /**
     * Verifies the Razorpay payment signature and confirms the booking.
     *
     * CRITICAL: Booking is confirmed ONLY after backend signature verification.
     * Never confirm based on frontend callback alone.
     *
     * Flow:
     *  1. Find booking by ID, assert it belongs to the logged-in user
     *  2. Verify HMAC-SHA256 signature (orderId|paymentId signed with key secret)
     *  3. On success: update Payment (SUCCESS) + Booking (CONFIRMED)
     *  4. On failure: update Payment (FAILED) + Booking (FAILED)
     */
    @Transactional
    public BookingDTOs.PaymentResponse verifyPayment(
            String userEmail, BookingDTOs.PaymentVerifyRequest request) {

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found: " + request.getBookingId()));

        if (!booking.getUser().getEmail().equals(userEmail)) {
            throw new UnauthorizedException("This booking does not belong to you");
        }

        if (booking.getBookingStatus() == BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Booking is already confirmed");
        }

        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment record not found for order: " + request.getRazorpayOrderId()));

        // Verify Razorpay signature
        boolean isValid = razorpayService.verifySignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature());

        if (isValid) {
            // Success — confirm booking
            payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
            payment.setRazorpaySignature(request.getRazorpaySignature());
            payment.setPaymentMethod(request.getPaymentMethod());
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setUpdatedAt(LocalDateTime.now());

            booking.setBookingStatus(BookingStatus.CONFIRMED);

            log.info("Booking {} confirmed. Payment: {}", booking.getId(),
                    request.getRazorpayPaymentId());

        } else {
            // Failure — mark as failed
            payment.setStatus(PaymentStatus.FAILED);
            booking.setBookingStatus(BookingStatus.FAILED);

            log.warn("Payment verification FAILED for booking {}", booking.getId());
            throw new PaymentException(
                    "Payment verification failed. Invalid signature.");
        }

        paymentRepository.save(payment);
        bookingRepository.save(booking);

        return toPaymentResponse(payment);
    }

    // =========================================================================
    // Cancel Booking + Initiate Refund
    // =========================================================================

    @Transactional
    public BookingDTOs.RefundResponse cancelBooking(
            Long bookingId, String userEmail,
            BookingDTOs.CancelBookingRequest request) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found: " + bookingId));

        if (!booking.getUser().getEmail().equals(userEmail)) {
            throw new UnauthorizedException("This booking does not belong to you");
        }

        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Booking is already cancelled");
        }

        booking.setBookingStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        // If payment was successful, initiate refund
        return paymentRepository.findByBookingId(bookingId)
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .map(payment -> {
                    Refund refund = razorpayService.initiateRefund(
                            payment.getRazorpayPaymentId(), payment.getAmount());

                    payment.setRefundId(refund.get("id"));
                    payment.setStatus(PaymentStatus.REFUNDED);
                    paymentRepository.save(payment);

                    log.info("Refund {} initiated for booking {}", refund.get("id"), bookingId);

                    return BookingDTOs.RefundResponse.builder()
                            .bookingId(bookingId)
                            .refundId(refund.get("id"))
                            .refundAmount(payment.getAmount())
                            .status("REFUNDED")
                            .message("Refund initiated successfully. Will reflect in 5-7 business days.")
                            .build();
                })
                .orElse(BookingDTOs.RefundResponse.builder()
                        .bookingId(bookingId)
                        .status("CANCELLED")
                        .message("Booking cancelled. No payment was made.")
                        .build());
    }

    // =========================================================================
    // Booking History
    // =========================================================================

    @Transactional(readOnly = true)
    public List<BookingDTOs.BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::toBookingResponse)
                .collect(Collectors.toList());
    }

    public Page<BookingDTOs.BookingResponse> getMyBookings(String email, Pageable pageable) {
        return bookingRepository.findByUserEmail(email, pageable)
                .map(this::toBookingResponse);
    }

    public BookingDTOs.BookingResponse getBookingById(Long bookingId, String email) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found: " + bookingId));

        if (!booking.getUser().getEmail().equals(email)) {
            throw new UnauthorizedException("This booking does not belong to you");
        }
        return toBookingResponse(booking);
    }

    // =========================================================================
    // Payment History
    // =========================================================================

    public List<BookingDTOs.PaymentResponse> getMyPayments(String email) {
        return paymentRepository.findByBookingUserEmail(email).stream()
                .map(this::toPaymentResponse)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // Response Mappers
    // =========================================================================

    private BookingDTOs.BookingResponse toBookingResponse(Booking b) {
        return BookingDTOs.BookingResponse.builder()
                .bookingId(b.getId())
                .tripTitle(b.getPredefinedTrip().getTitle())
                .participantCount(b.getParticipantCount())
                .travelDate(b.getTravelDate())
                .totalAmount(b.getTotalAmount())
                .bookingStatus(b.getBookingStatus().name())
                .razorpayOrderId(b.getRazorpayOrderId())
                .currency(razorpayConfig.getCurrency())
                .userName(b.getUser().getName())
                .createdAt(b.getCreatedAt().toString())
                .build();
    }

    private BookingDTOs.PaymentResponse toPaymentResponse(Payment p) {
        return BookingDTOs.PaymentResponse.builder()
                .paymentId(p.getId())
                .bookingId(p.getBooking().getId())
                .razorpayOrderId(p.getRazorpayOrderId())
                .razorpayPaymentId(p.getRazorpayPaymentId())
                .amount(p.getAmount())
                .currency(p.getCurrency())
                .paymentMethod(p.getPaymentMethod())
                .status(p.getStatus().name())
                .createdAt(p.getCreatedAt().toString())
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }
}