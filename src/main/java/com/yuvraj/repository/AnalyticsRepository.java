package com.yuvraj.repository;

import com.yuvraj.entity.BookingStatus;
import com.yuvraj.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.yuvraj.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnalyticsRepository extends JpaRepository<Booking, Long> {

    // ── Revenue ───────────────────────────────────────────────────────────────

    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM Payment p
        WHERE p.status = 'SUCCESS'
        """)
    BigDecimal getTotalRevenue();

    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM Payment p
        WHERE p.status = 'SUCCESS'
          AND p.createdAt >= :from
        """)
    BigDecimal getRevenueFrom(@Param("from") LocalDateTime from);

    // ── Booking counts ────────────────────────────────────────────────────────

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.bookingStatus = :status")
    long countByStatus(@Param("status") BookingStatus status);

    // ── Monthly revenue ───────────────────────────────────────────────────────

    @Query("""
    SELECT FUNCTION('DATE_FORMAT', p.createdAt, '%Y-%m'),
           COALESCE(SUM(p.amount), 0),
           COUNT(p)
    FROM Payment p
    WHERE p.status = 'SUCCESS'
    GROUP BY FUNCTION('DATE_FORMAT', p.createdAt, '%Y-%m')
    ORDER BY FUNCTION('DATE_FORMAT', p.createdAt, '%Y-%m') DESC
    """)
    List<Object[]> getMonthlyRevenue();

    // ── Top trips by bookings ─────────────────────────────────────────────────

    @Query("""
        SELECT b.predefinedTrip.id,
               b.predefinedTrip.title,
               COUNT(b),
               COALESCE(SUM(b.totalAmount), 0)
        FROM Booking b
        WHERE b.bookingStatus = 'CONFIRMED'
        GROUP BY b.predefinedTrip.id, b.predefinedTrip.title
        ORDER BY COUNT(b) DESC
        """)
    List<Object[]> getTopTripsByBookings(Pageable pageable);

    // ── Bookings by category ──────────────────────────────────────────────────

    @Query("""
        SELECT b.predefinedTrip.category,
               COUNT(b)
        FROM Booking b
        WHERE b.bookingStatus = 'CONFIRMED'
        GROUP BY b.predefinedTrip.category
        """)
    List<Object[]> getBookingsByCategory();

    // ── Per-user stats ────────────────────────────────────────────────────────

    @Query("""
        SELECT COUNT(b), COALESCE(SUM(b.totalAmount), 0)
        FROM Booking b
        WHERE b.user.id = :userId
          AND b.bookingStatus = 'CONFIRMED'
        """)
    Object[] getUserBookingStats(@Param("userId") Long userId);

    @Query("""
        SELECT COUNT(e), COALESCE(SUM(e.amount), 0)
        FROM Expense e
        WHERE e.paidBy.id = :userId
        """)
    Object[] getUserExpenseStats(@Param("userId") Long userId);

    @Query("""
        SELECT COALESCE(SUM(s.amount), 0)
        FROM Settlement s
        WHERE s.fromUser.id = :userId
          AND s.status = 'COMPLETED'
        """)
    BigDecimal getUserTotalSettled(@Param("userId") Long userId);

    // ── Trip analytics ────────────────────────────────────────────────────────

    @Query("""
        SELECT e.category, COUNT(e), COALESCE(SUM(e.amount), 0)
        FROM Expense e
        WHERE e.trip.id = :tripId
        GROUP BY e.category
        """)
    List<Object[]> getExpensesByCategory(@Param("tripId") Long tripId);

    @Query("""
        SELECT COALESCE(SUM(s.amount), 0)
        FROM Settlement s
        WHERE s.trip.id = :tripId
          AND s.status = 'COMPLETED'
        """)
    BigDecimal getTripTotalSettled(@Param("tripId") Long tripId);
}