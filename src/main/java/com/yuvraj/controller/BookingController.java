package com.yuvraj.controller;

import com.yuvraj.dto.ApiResponse;
import com.yuvraj.dto.booking.BookingDTOs;
import com.yuvraj.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // =========================================================================
    // BOOKING
    // =========================================================================

    /**
     * POST /api/bookings
     * Step 1 of the payment flow.
     * Creates a pending booking + a Razorpay order.
     * Returns the Razorpay order details needed to initialise the frontend SDK.
     */
    @PostMapping("/bookings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BookingDTOs.CreateOrderResponse>> createBooking(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody BookingDTOs.CreateBookingRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Booking initiated. Proceed to payment.",
                        bookingService.createBookingAndOrder(user.getUsername(), request)));
    }

    /**
     * GET /api/bookings/history
     * Returns all bookings made by the logged-in user.
     */
    @GetMapping("/bookings/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<BookingDTOs.BookingResponse>>> getMyBookings(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.success("Booking history",
                bookingService.getMyBookings(user.getUsername(), pageable)));
    }

    /**
     * GET /api/bookings/{id}
     * Returns a single booking detail.
     */
    @GetMapping("/bookings/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BookingDTOs.BookingResponse>> getBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(ApiResponse.success("Booking details",
                bookingService.getBookingById(id, user.getUsername())));
    }

    /**
     * DELETE /api/bookings/{id}/cancel
     * Cancels a booking and initiates a Razorpay refund if payment was made.
     */
    @DeleteMapping("/bookings/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BookingDTOs.RefundResponse>> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user,
            @RequestBody(required = false) BookingDTOs.CancelBookingRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Booking cancelled",
                bookingService.cancelBooking(id, user.getUsername(),
                        request != null ? request : new BookingDTOs.CancelBookingRequest())));
    }

    // =========================================================================
    // PAYMENT
    // =========================================================================

    /**
     * POST /api/payments/verify
     * Step 2 of the payment flow.
     * Called by the frontend AFTER Razorpay payment completes.
     * Verifies the HMAC-SHA256 signature on the backend and confirms the booking.
     *
     * Frontend Razorpay SDK sends:
     *   - razorpay_order_id
     *   - razorpay_payment_id
     *   - razorpay_signature
     */
    @PostMapping("/payments/verify")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BookingDTOs.PaymentResponse>> verifyPayment(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody BookingDTOs.PaymentVerifyRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Payment verified. Booking confirmed!",
                bookingService.verifyPayment(user.getUsername(), request)));
    }

    /**
     * GET /api/payments/history
     * Returns full payment history for the logged-in user.
     */
    @GetMapping("/payments/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<BookingDTOs.PaymentResponse>>> getPaymentHistory(
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(ApiResponse.success("Payment history",
                bookingService.getMyPayments(user.getUsername())));
    }
}