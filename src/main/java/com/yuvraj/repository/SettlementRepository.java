package com.yuvraj.repository;

import com.yuvraj.entity.Settlement;
import com.yuvraj.entity.SettlementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    List<Settlement> findByTripId(Long tripId);

    List<Settlement> findByFromUserIdAndStatus(Long fromUserId, SettlementStatus status);

    List<Settlement> findByToUserIdAndStatus(Long toUserId, SettlementStatus status);

    @Query("""
        SELECT s FROM Settlement s
        WHERE s.trip.id = :tripId
          AND (s.fromUser.id = :userId OR s.toUser.id = :userId)
        ORDER BY s.createdAt DESC
        """)
    List<Settlement> findByTripAndUser(@Param("tripId") Long tripId, @Param("userId") Long userId);

    @Query("""
        SELECT s FROM Settlement s
        WHERE (s.fromUser.id = :userId OR s.toUser.id = :userId)
          AND s.status != 'COMPLETED'
        ORDER BY s.createdAt DESC
        """)
    List<Settlement> findPendingByUser(@Param("userId") Long userId);
}