package com.yuvraj.repository;

import com.yuvraj.entity.TripStatus;
import com.yuvraj.entity.UserTrip;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserTripRepository extends JpaRepository<UserTrip, Long> {

    // All trips created by a user
    Page<UserTrip> findByCreatedByEmail(String email, Pageable pageable);

    // All trips where user is a member (includes creator)
    @Query("""
        SELECT t FROM UserTrip t
        WHERE t.createdBy.email = :email
           OR :email IN (SELECT m.email FROM t.members m)
        """)
    Page<UserTrip> findAllByMemberEmail(@Param("email") String email, Pageable pageable);

    // Trips by status
    @Query("""
        SELECT t FROM UserTrip t
        WHERE (t.createdBy.email = :email
               OR :email IN (SELECT m.email FROM t.members m))
          AND t.status = :status
        """)
    List<UserTrip> findByMemberEmailAndStatus(
            @Param("email") String email,
            @Param("status") TripStatus status
    );
}