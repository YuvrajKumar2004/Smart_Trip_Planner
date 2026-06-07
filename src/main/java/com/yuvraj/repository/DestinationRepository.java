package com.yuvraj.repository;

import com.yuvraj.entity.Destination;
import com.yuvraj.entity.TripCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface DestinationRepository
        extends JpaRepository<Destination, Long>, JpaSpecificationExecutor<Destination> {

    List<Destination> findByCategory(TripCategory category);

    List<Destination> findByStateIgnoreCase(String state);

    @Query("""
        SELECT d FROM Destination d
        WHERE (:keyword IS NULL
               OR LOWER(d.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(d.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:category IS NULL OR d.category = :category)
          AND (:maxCost IS NULL OR d.avgCostPerPerson <= :maxCost)
          AND (:season IS NULL OR LOWER(d.bestSeason) LIKE LOWER(CONCAT('%', :season, '%')))
        ORDER BY d.name ASC
        """)
    List<Destination> search(
            @Param("keyword")  String keyword,
            @Param("category") TripCategory category,
            @Param("maxCost")  BigDecimal maxCost,
            @Param("season")   String season
    );
}