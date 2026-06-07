package com.yuvraj.controller;

import com.yuvraj.dto.ApiResponse;
import com.yuvraj.dto.analytics.AnalyticsDTOs;
import com.yuvraj.dto.booking.BookingDTOs;
import com.yuvraj.dto.expense.ExpenseDTOs;
import com.yuvraj.entity.User;
import com.yuvraj.exception.ResourceNotFoundException;
import com.yuvraj.repository.UserRepository;
import com.yuvraj.service.AnalyticsService;
import com.yuvraj.service.BookingService;
import com.yuvraj.service.ExpenseService;
import com.yuvraj.service.SettlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class HistoryController {

    private final BookingService    bookingService;
    private final AnalyticsService  analyticsService;
    private final SettlementService settlementService;
    private final UserRepository    userRepository;

    /**
     * GET /api/history/summary
     * Full personal history summary — trips, bookings, expenses, settlements.
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AnalyticsDTOs.UserHistorySummary>> getMySummary(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return ResponseEntity.ok(ApiResponse.success("Your history summary",
                analyticsService.getUserHistory(user.getId())));
    }

    /**
     * GET /api/history/bookings
     * Paginated booking history.
     */
    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<Page<BookingDTOs.BookingResponse>>> getBookingHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(ApiResponse.success("Booking history",
                bookingService.getMyBookings(userDetails.getUsername(),
                        PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    /**
     * GET /api/history/payments
     * Full payment history.
     */
    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<BookingDTOs.PaymentResponse>>> getPaymentHistory(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(ApiResponse.success("Payment history",
                bookingService.getMyPayments(userDetails.getUsername())));
    }

    /**
     * GET /api/history/settlements
     * All pending and completed settlements involving this user.
     */
    @GetMapping("/settlements")
    public ResponseEntity<ApiResponse<List<ExpenseDTOs.SettlementResponse>>> getSettlementHistory(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(ApiResponse.success("Settlement history",
                settlementService.getPending(userDetails.getUsername())));
    }

    /**
     * GET /api/history/trips/{tripId}/analytics
     * Expense analytics for a specific trip (members only).
     */
    @GetMapping("/trips/{tripId}/analytics")
    public ResponseEntity<ApiResponse<AnalyticsDTOs.TripAnalytics>> getTripAnalytics(
            @PathVariable Long tripId) {

        return ResponseEntity.ok(ApiResponse.success("Trip analytics",
                analyticsService.getTripAnalytics(tripId)));
    }
}