package com.yuvraj.controller;

import com.yuvraj.dto.ApiResponse;
import com.yuvraj.dto.analytics.AnalyticsDTOs;
import com.yuvraj.dto.booking.BookingDTOs;
import com.yuvraj.service.AdminService;
import com.yuvraj.service.AnalyticsService;
import com.yuvraj.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminController {

    private final AnalyticsService analyticsService;
    private final AdminService     adminService;
    private final BookingService   bookingService;

    // ── Dashboard ─────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/dashboard
     * Full platform overview — revenue, bookings, top trips, monthly stats.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AnalyticsDTOs.AdminDashboard>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success("Dashboard data",
                analyticsService.getAdminDashboard()));
    }

    // ── User Management ───────────────────────────────────────────────────────

    /**
     * GET /api/admin/users
     * List all registered users with their booking stats.
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AnalyticsDTOs.AdminUserView>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success("All users",
                analyticsService.getAllUsers()));
    }

    /**
     * GET /api/admin/users/{userId}/history
     * Full activity history for a specific user.
     */
    @GetMapping("/users/{userId}/history")
    public ResponseEntity<ApiResponse<AnalyticsDTOs.UserHistorySummary>> getUserHistory(
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success("User history",
                analyticsService.getUserHistory(userId)));
    }

    /**
     * DELETE /api/admin/users/{userId}
     * Remove a user. Restricted to SUPER_ADMIN.
     */
    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User deleted", null));
    }

    // ── Admin Creation ────────────────────────────────────────────────────────

    /**
     * POST /api/admin/create-admin
     * Create a new ADMIN or SUPER_ADMIN account.
     * Only SUPER_ADMIN can create SUPER_ADMIN.
     */
    @PostMapping("/create-admin")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AnalyticsDTOs.AdminUserView>> createAdmin(
            @Valid @RequestBody AnalyticsDTOs.CreateAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Admin created",
                        adminService.createAdmin(request)));
    }

    // ── Trip Analytics ────────────────────────────────────────────────────────

    /**
     * GET /api/admin/trips/{tripId}/analytics
     * Expense breakdown, settlement status, and member stats for a user trip.
     */
    @GetMapping("/trips/{tripId}/analytics")
    public ResponseEntity<ApiResponse<AnalyticsDTOs.TripAnalytics>> getTripAnalytics(
            @PathVariable Long tripId) {
        return ResponseEntity.ok(ApiResponse.success("Trip analytics",
                analyticsService.getTripAnalytics(tripId)));
    }

    /**
     * GET /api/admin/bookings
     * Retrieve all bookings for administration panel.
     */
    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<List<BookingDTOs.BookingResponse>>> getAllBookings() {
        return ResponseEntity.ok(ApiResponse.success("All bookings",
                bookingService.getAllBookings()));
    }
}