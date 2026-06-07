package com.yuvraj.service;

import com.yuvraj.dto.analytics.AnalyticsDTOs;
import com.yuvraj.entity.*;
import com.yuvraj.exception.ResourceNotFoundException;
import com.yuvraj.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsRepository   analyticsRepository;
    private final UserRepository        userRepository;
    private final UserTripRepository    userTripRepository;
    private final ExpenseRepository     expenseRepository;
    private final BookingRepository     bookingRepository;
    private final SettlementRepository  settlementRepository;

    // =========================================================================
    // ADMIN DASHBOARD
    // =========================================================================

    public AnalyticsDTOs.AdminDashboard getAdminDashboard() {

        long totalUsers        = userRepository.count();
        long totalBookings     = bookingRepository.count();
        long confirmedBookings = analyticsRepository.countByStatus(BookingStatus.CONFIRMED);
        long cancelledBookings = analyticsRepository.countByStatus(BookingStatus.CANCELLED);
        long totalUserTrips    = userTripRepository.count();
        long totalExpenses     = expenseRepository.count();

        BigDecimal totalRevenue     = analyticsRepository.getTotalRevenue();
        BigDecimal revenueThisMonth = analyticsRepository.getRevenueFrom(
                LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0));

        BigDecimal totalExpenseValue = expenseRepository.sumTotalByTrip(0L); // all trips
        // Use a proper all-expense query:
        BigDecimal allExpenses = expenseRepository.findAll().stream()
                .map(e -> e.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Top 5 trips by bookings
        List<AnalyticsDTOs.PopularTripStat> topTrips =
                analyticsRepository.getTopTripsByBookings(PageRequest.of(0, 5))
                        .stream()
                        .map(row -> AnalyticsDTOs.PopularTripStat.builder()
                                .tripId(((Number) row[0]).longValue())
                                .tripTitle((String) row[1])
                                .totalBookings(((Number) row[2]).longValue())
                                .totalRevenue((BigDecimal) row[3])
                                .build())
                        .collect(Collectors.toList());

        // Monthly revenue (last 12 months)
        List<AnalyticsDTOs.MonthlyStat> monthlyRevenue =
                analyticsRepository.getMonthlyRevenue().stream()
                        .limit(12)
                        .map(row -> AnalyticsDTOs.MonthlyStat.builder()
                                .month((String) row[0])
                                .revenue((BigDecimal) row[1])
                                .bookingCount(((Number) row[2]).longValue())
                                .build())
                        .collect(Collectors.toList());

        // Bookings by category
        long totalConfirmed = Math.max(confirmedBookings, 1);
        List<AnalyticsDTOs.CategoryStat> bookingsByCategory =
                analyticsRepository.getBookingsByCategory().stream()
                        .map(row -> {
                            long count = ((Number) row[1]).longValue();
                            return AnalyticsDTOs.CategoryStat.builder()
                                    .category(row[0].toString())
                                    .count(count)
                                    .percentage(BigDecimal.valueOf(count * 100.0 / totalConfirmed)
                                            .setScale(1, RoundingMode.HALF_UP))
                                    .build();
                        })
                        .collect(Collectors.toList());

        return AnalyticsDTOs.AdminDashboard.builder()
                .totalUsers(totalUsers)
                .totalTrips(bookingRepository.count())
                .totalUserTrips(totalUserTrips)
                .totalBookings(totalBookings)
                .confirmedBookings(confirmedBookings)
                .cancelledBookings(cancelledBookings)
                .totalRevenue(totalRevenue)
                .revenueThisMonth(revenueThisMonth)
                .totalExpensesRecorded(totalExpenses)
                .totalExpenseValue(allExpenses)
                .topTrips(topTrips)
                .monthlyRevenue(monthlyRevenue)
                .bookingsByCategory(bookingsByCategory)
                .build();
    }

    // =========================================================================
    // USER HISTORY
    // =========================================================================

    public AnalyticsDTOs.UserHistorySummary getUserHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Object[] bookingStats = normalizeAggregatePair(analyticsRepository.getUserBookingStats(userId));
        Object[] expenseStats = normalizeAggregatePair(analyticsRepository.getUserExpenseStats(userId));
        BigDecimal totalSettled = analyticsRepository.getUserTotalSettled(userId);

        long tripsCreated = userTripRepository.findByCreatedByEmail(
                user.getEmail(), PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();

        long tripsJoined = userTripRepository.findAllByMemberEmail(
                user.getEmail(), PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();

        return AnalyticsDTOs.UserHistorySummary.builder()
                .userId(user.getId())
                .userName(user.getName())
                .email(user.getEmail())
                .totalTripsCreated(tripsCreated)
                .totalTripsJoined(tripsJoined)
                .totalBookings(toLong(bookingStats[0]))
                .totalBookingSpend(toBigDecimal(bookingStats[1]))
                .totalExpensesAdded(toLong(expenseStats[0]))
                .totalExpenseValue(toBigDecimal(expenseStats[1]))
                .totalAmountSettled(totalSettled != null ? totalSettled : BigDecimal.ZERO)
                .memberSince(user.getCreatedAt().toLocalDate().toString())
                .build();
    }

    // =========================================================================
    // ALL USERS (Admin)
    // =========================================================================

    public List<AnalyticsDTOs.AdminUserView> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> {
                    Object[] stats = normalizeAggregatePair(analyticsRepository.getUserBookingStats(user.getId()));
                    return AnalyticsDTOs.AdminUserView.builder()
                            .id(user.getId())
                            .name(user.getName())
                            .email(user.getEmail())
                            .role(user.getRole().name())
                            .provider(user.getProvider() != null ? user.getProvider().name() : "LOCAL")
                            .totalBookings(toLong(stats[0]))
                            .totalSpend(toBigDecimal(stats[1]))
                            .joinedAt(user.getCreatedAt().toLocalDate().toString())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // =========================================================================
    // TRIP ANALYTICS
    // =========================================================================

    public AnalyticsDTOs.TripAnalytics getTripAnalytics(Long tripId) {
        UserTrip trip = userTripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found: " + tripId));

        BigDecimal totalExpenses = expenseRepository.sumTotalByTrip(tripId);
        int memberCount = trip.getMembers().size() + 1; // +1 for creator

        BigDecimal avgPerPerson = memberCount > 0
                ? totalExpenses.divide(BigDecimal.valueOf(memberCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal totalSettled = analyticsRepository.getTripTotalSettled(tripId);
        BigDecimal totalPending = totalExpenses.subtract(
                totalSettled != null ? totalSettled : BigDecimal.ZERO);

        // Expenses by category
        List<Object[]> catRows = analyticsRepository.getExpensesByCategory(tripId);
        BigDecimal grandTotal = totalExpenses.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ONE : totalExpenses;

        List<AnalyticsDTOs.CategoryExpenseStat> byCategory = catRows.stream()
                .map(row -> {
                    BigDecimal catAmount = (BigDecimal) row[2];
                    return AnalyticsDTOs.CategoryExpenseStat.builder()
                            .category(row[0].toString())
                            .count(((Number) row[1]).longValue())
                            .totalAmount(catAmount)
                            .percentage(catAmount.divide(grandTotal, 4, RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(100))
                                    .setScale(1, RoundingMode.HALF_UP))
                            .build();
                })
                .collect(Collectors.toList());

        return AnalyticsDTOs.TripAnalytics.builder()
                .tripId(tripId)
                .tripTitle(trip.getTitle())
                .totalMembers(memberCount)
                .totalExpenses(totalExpenses)
                .averageExpensePerPerson(avgPerPerson)
                .expensesByCategory(byCategory)
                .totalSettled(totalSettled != null ? totalSettled : BigDecimal.ZERO)
                .totalPending(totalPending.max(BigDecimal.ZERO))
                .build();
    }

    private Object[] normalizeAggregatePair(Object rawStats) {
        if (rawStats == null) {
            return new Object[]{0L, BigDecimal.ZERO};
        }
        if (rawStats instanceof Object[] arr) {
            if (arr.length == 1 && arr[0] instanceof Object[] nested) {
                arr = nested;
            }
            Object first = arr.length > 0 ? arr[0] : 0L;
            Object second = arr.length > 1 ? arr[1] : BigDecimal.ZERO;
            return new Object[]{first, second};
        }
        return new Object[]{rawStats, BigDecimal.ZERO};
    }

    private long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(value.toString());
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(value.toString());
    }
}
