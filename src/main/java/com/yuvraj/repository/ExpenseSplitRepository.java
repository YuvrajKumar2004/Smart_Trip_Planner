package com.yuvraj.repository;

import com.yuvraj.entity.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {

    List<ExpenseSplit> findByExpenseId(Long expenseId);

    List<ExpenseSplit> findByUserIdAndSettledFalse(Long userId);

    // Total amount owed by a user in a trip
    @Query("""
        SELECT COALESCE(SUM(s.amountOwed), 0)
        FROM ExpenseSplit s
        WHERE s.expense.trip.id = :tripId
          AND s.user.id = :userId
        """)
    BigDecimal sumOwedByUserInTrip(@Param("tripId") Long tripId, @Param("userId") Long userId);

    // All unsettled splits for a trip
    @Query("""
        SELECT s FROM ExpenseSplit s
        WHERE s.expense.trip.id = :tripId
          AND s.settled = false
        """)
    List<ExpenseSplit> findUnsettledByTrip(@Param("tripId") Long tripId);

    // Splits for a specific user in a trip
    @Query("""
        SELECT s FROM ExpenseSplit s
        WHERE s.expense.trip.id = :tripId
          AND s.user.id = :userId
        """)
    List<ExpenseSplit> findByTripAndUser(@Param("tripId") Long tripId, @Param("userId") Long userId);
}