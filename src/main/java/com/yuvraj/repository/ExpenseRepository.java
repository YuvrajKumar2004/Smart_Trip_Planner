package com.yuvraj.repository;

import com.yuvraj.entity.Expense;
import com.yuvraj.entity.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByTripId(Long tripId);

    List<Expense> findByTripIdAndCategory(Long tripId, ExpenseCategory category);

    List<Expense> findByPaidByEmail(String email);

    // Total amount paid by a user in a trip
    @Query("""
        SELECT COALESCE(SUM(e.amount), 0)
        FROM Expense e
        WHERE e.trip.id = :tripId
          AND e.paidBy.id = :userId
        """)
    BigDecimal sumPaidByUserInTrip(@Param("tripId") Long tripId, @Param("userId") Long userId);

    // Total expenses in a trip
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.trip.id = :tripId")
    BigDecimal sumTotalByTrip(@Param("tripId") Long tripId);
}