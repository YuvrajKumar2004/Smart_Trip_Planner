package com.yuvraj.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    // Razorpay order ID (e.g. order_XXXXXXXXXX)
    @Column(nullable = false)
    private String razorpayOrderId;

    // Razorpay payment ID after successful payment (e.g. pay_XXXXXXXXXX)
    private String razorpayPaymentId;

    // Razorpay signature returned in the callback
    private String razorpaySignature;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    // Currency code, e.g. "INR"
    @Column(nullable = false)
    @Builder.Default
    private String currency = "INR";

    // Payment method selected by user (UPI, CARD, NET_BANKING, etc.)
    private String paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    // Razorpay refund ID if refunded
    private String refundId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}