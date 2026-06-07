package com.yuvraj.repository;

import com.yuvraj.entity.Booking;
import com.yuvraj.entity.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    Page<Booking> findByUserEmail(String email, Pageable pageable);

    List<Booking> findByUserEmailAndBookingStatus(String email, BookingStatus status);

    Optional<Booking> findByRazorpayOrderId(String razorpayOrderId);

    // Admin: all bookings for a predefined trip
    Page<Booking> findByPredefinedTripId(Long tripId, Pageable pageable);

    long countByPredefinedTripId(Long tripId);
}