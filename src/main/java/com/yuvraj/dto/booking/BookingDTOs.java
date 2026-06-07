package com.yuvraj.dto.booking;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

public class BookingDTOs {

    // =========================================================================
    // BOOKING
    // =========================================================================

    @Data
    public static class CreateBookingRequest {

        @NotNull(message = "Trip ID is required")
        private Long predefinedTripId;

        @Min(value = 1, message = "At least 1 participant required")
        @NotNull
        private Integer participantCount;

        @NotNull(message = "Travel date is required")
        @FutureOrPresent(message = "Travel date must be today or in the future")
        private LocalDate travelDate;
    }

    @Data
    @Builder
    public static class BookingResponse {
        private Long bookingId;
        private String tripTitle;
        private Integer participantCount;
        private LocalDate travelDate;
        private BigDecimal totalAmount;
        private String bookingStatus;
        private String razorpayOrderId;
        private String currency;
        private String userName;
        private String createdAt;
    }

    // =========================================================================
    // PAYMENT — CREATE ORDER
    // =========================================================================

    @Data
    @Builder
    public static class CreateOrderResponse {
        private String razorpayOrderId;
        private BigDecimal amount;           // in major units (₹), NOT paise
        private String currency;
        private Long bookingId;
        private String keyId;                // Razorpay public key for frontend
    }

    // =========================================================================
    // PAYMENT — VERIFY (callback from frontend after payment)
    // =========================================================================

    @Data
    public static class PaymentVerifyRequest {

        @NotNull
        private Long bookingId;

        @NotBlank(message = "Razorpay order ID is required")
        private String razorpayOrderId;

        @NotBlank(message = "Razorpay payment ID is required")
        private String razorpayPaymentId;

        @NotBlank(message = "Razorpay signature is required")
        private String razorpaySignature;

        private String paymentMethod;         // UPI, CARD, etc.
    }

    @Data
    @Builder
    public static class PaymentResponse {
        private Long paymentId;
        private Long bookingId;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private BigDecimal amount;
        private String currency;
        private String paymentMethod;
        private String status;
        private String createdAt;
    }

    // =========================================================================
    // CANCELLATION
    // =========================================================================

    @Data
    public static class CancelBookingRequest {
        private String reason;
    }

    @Data
    @Builder
    public static class RefundResponse {
        private Long bookingId;
        private String refundId;
        private BigDecimal refundAmount;
        private String status;
        private String message;
    }
}