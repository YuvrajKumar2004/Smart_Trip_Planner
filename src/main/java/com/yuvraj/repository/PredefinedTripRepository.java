package com.yuvraj.repository;

import com.yuvraj.entity.PredefinedTrip;
import com.yuvraj.entity.TripCategory;
import com.yuvraj.entity.TransportMode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface PredefinedTripRepository extends JpaRepository<PredefinedTrip, Long> {

    Page<PredefinedTrip> findByActiveTrue(Pageable pageable);

    @Query("""
        SELECT t FROM PredefinedTrip t
        WHERE t.active = true
          AND (:keyword IS NULL
               OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:category IS NULL OR t.category = :category)
          AND (:maxPrice IS NULL OR t.pricePerPerson <= :maxPrice)
          AND (:minPrice IS NULL OR t.pricePerPerson >= :minPrice)
          AND (:season IS NULL OR LOWER(t.bestSeason) LIKE LOWER(CONCAT('%', :season, '%')))
          AND (:maxDays IS NULL OR t.durationDays <= :maxDays)
          AND (:transport IS NULL OR t.transportMode = :transport)
        """)
    Page<PredefinedTrip> search(
            @Param("keyword")  String keyword,
            @Param("category") TripCategory category,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("season")   String season,
            @Param("maxDays")  Integer maxDays,
            @Param("transport") TransportMode transport,
            Pageable pageable
    );
}