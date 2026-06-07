package com.yuvraj.service;

import com.razorpay.Order;
import com.razorpay.Refund;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.yuvraj.config.RazorpayConfig;
import com.yuvraj.exception.PaymentException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Handles all Razorpay API interactions:
 *  - Creating payment orders
 *  - Verifying HMAC-SHA256 payment signatures
 *  - Processing refunds
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpayService {

    private final RazorpayClient  razorpayClient;
    private final RazorpayConfig  razorpayConfig;

    // ── Create Order ──────────────────────────────────────────────────────────

    /**
     * Creates a Razorpay order.
     * Amount is in paise (1 INR = 100 paise), so multiply by 100.
     *
     * @param amount   Amount in INR (major units)
     * @param currency e.g. "INR"
     * @param receipt  unique receipt reference (e.g. "booking_123")
     * @return Razorpay Order object containing orderId
     */
    public Order createOrder(BigDecimal amount, String currency, String receipt) {
        try {
            JSONObject options = new JSONObject();
            options.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue()); // paise
            options.put("currency", currency);
            options.put("receipt", receipt);
            options.put("payment_capture", 1); // auto-capture payment

            Order order = razorpayClient.orders.create(options);
            log.info("Razorpay order created: {}", Optional.ofNullable(order.get("id")));
            return order;

        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay order: {}", e.getMessage());
            throw new PaymentException("Failed to create payment order: " + e.getMessage());
        }
    }

    // ── Verify Signature ──────────────────────────────────────────────────────

    /**
     * Verifies the Razorpay payment signature using HMAC-SHA256.
     *
     * Razorpay signs: orderId + "|" + paymentId  with the key secret.
     * We recompute the HMAC and compare with the received signature.
     *
     * CRITICAL: Always verify on the backend. Never trust the frontend alone.
     *
     * @return true if signature is valid, false otherwise
     */
    public boolean verifySignature(String razorpayOrderId,
                                   String razorpayPaymentId,
                                   String razorpaySignature) {
        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            String expected = hmacSHA256(payload, razorpayConfig.getKeySecret());
            boolean valid = expected.equals(razorpaySignature);

            if (!valid) {
                log.warn("Razorpay signature mismatch for orderId={}", razorpayOrderId);
            }
            return valid;

        } catch (Exception e) {
            log.error("Signature verification error: {}", e.getMessage());
            return false;
        }
    }

    // ── Refund ────────────────────────────────────────────────────────────────

    /**
     * Initiates a full refund for a payment.
     *
     * @param razorpayPaymentId the payment ID to refund (pay_XXXXXXXXXX)
     * @param amount            amount to refund in INR (converted to paise internally)
     * @return Razorpay Refund object
     */
    public Refund initiateRefund(String razorpayPaymentId, BigDecimal amount) {
        try {
            JSONObject options = new JSONObject();
            options.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue());
            options.put("speed", "normal"); // "normal" or "optimum"

            Refund refund = razorpayClient.payments.refund(razorpayPaymentId, options);
            log.info("Razorpay refund initiated: {} for payment: {}",
                    refund.get("id"), razorpayPaymentId);
            return refund;

        } catch (RazorpayException e) {
            log.error("Refund failed for payment {}: {}", razorpayPaymentId, e.getMessage());
            throw new PaymentException("Refund failed: " + e.getMessage());
        }
    }

    // ── HMAC-SHA256 ───────────────────────────────────────────────────────────

    private String hmacSHA256(String data, String secret)
            throws NoSuchAlgorithmException, InvalidKeyException {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(
                secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}