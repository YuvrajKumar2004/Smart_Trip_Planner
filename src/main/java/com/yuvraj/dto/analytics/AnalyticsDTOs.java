package com.yuvraj.dto.analytics;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

public class AnalyticsDTOs {

    // =========================================================================
    // ADMIN DASHBOARD OVERVIEW
    // =========================================================================

    @Data
    @Builder
    public static class AdminDashboard {
        private long totalUsers;
        private long totalTrips;            // predefined trips
        private long totalUserTrips;        // user-created trips
        private long totalBookings;
        private long confirmedBookings;
        private long cancelledBookings;
        private BigDecimal totalRevenue;
        private BigDecimal revenueThisMonth;
        private long totalExpensesRecorded;
        private BigDecimal totalExpenseValue;
        private List<PopularTripStat> topTrips;
        private List<MonthlyStat>     monthlyRevenue;
        private List<CategoryStat>    bookingsByCategory;
    }

    @Data
    @Builder
    public static class PopularTripStat {
        private Long tripId;
        private String tripTitle;
        private long totalBookings;
        private BigDecimal totalRevenue;
    }

    @Data
    @Builder
    public static class MonthlyStat {
        private String month;          // e.g. "2025-01"
        private BigDecimal revenue;
        private long bookingCount;
    }

    @Data
    @Builder
    public static class CategoryStat {
        private String category;
        private long count;
        private BigDecimal percentage;
    }

    // =========================================================================
    // USER HISTORY SUMMARY
    // =========================================================================

    @Data
    @Builder
    public static class UserHistorySummary {
        private Long userId;
        private String userName;
        private String email;
        private long totalTripsCreated;
        private long totalTripsJoined;
        private long totalBookings;
        private BigDecimal totalBookingSpend;
        private long totalExpensesAdded;
        private BigDecimal totalExpenseValue;
        private BigDecimal totalAmountSettled;
        private String memberSince;
    }

    // =========================================================================
    // TRIP ANALYTICS
    // =========================================================================

    @Data
    @Builder
    public static class TripAnalytics {
        private Long tripId;
        private String tripTitle;
        private int totalMembers;
        private BigDecimal totalExpenses;
        private BigDecimal averageExpensePerPerson;
        private List<CategoryExpenseStat> expensesByCategory;
        private BigDecimal totalSettled;
        private BigDecimal totalPending;
    }

    @Data
    @Builder
    public static class CategoryExpenseStat {
        private String category;
        private BigDecimal totalAmount;
        private long count;
        private BigDecimal percentage;
    }

    // =========================================================================
    // ADMIN: USER LIST
    // =========================================================================

    @Data
    @Builder
    public static class AdminUserView {
        private Long id;
        private String name;
        private String email;
        private String role;
        private String provider;
        private long totalBookings;
        private BigDecimal totalSpend;
        private String joinedAt;
    }

    // =========================================================================
    // ADMIN: CREATE ADMIN REQUEST
    // =========================================================================

    @Data
    public static class CreateAdminRequest {
        private String name;
        private String email;
        private String password;
        private String role;   // "ADMIN" or "SUPER_ADMIN"
    }
}