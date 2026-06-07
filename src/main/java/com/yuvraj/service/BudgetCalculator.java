package com.yuvraj.service;

import com.yuvraj.dto.recommendation.RecommendationDTOs;
import com.yuvraj.entity.Destination;
import com.yuvraj.entity.TransportMode;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Budget Calculator
 * ─────────────────
 * Estimates trip costs broken into 5 components:
 *
 *   Transport  → based on TransportMode × number of travelers × distance factor
 *   Hotel      → ₹2,000/person/night (budget baseline, scales with category)
 *   Food       → ₹600/person/day
 *   Activity   → avg destination cost × 0.3 (30% of destination avg)
 *   Misc       → 10% of (transport + hotel + food + activity)
 *
 * All costs in INR.
 * These are estimation heuristics — real systems integrate hotel/flight APIs.
 */
@Component
public class BudgetCalculator {

    // ── Per-person per-day rates (INR) ────────────────────────────────────────
    private static final BigDecimal HOTEL_COST_PER_PERSON_PER_NIGHT = new BigDecimal("2000");
    private static final BigDecimal FOOD_COST_PER_PERSON_PER_DAY    = new BigDecimal("600");
    private static final BigDecimal MISC_PERCENTAGE                  = new BigDecimal("0.10");

    // ── Transport base costs per person (one-way, INR) ────────────────────────
    private static final BigDecimal FLIGHT_BASE = new BigDecimal("4500");
    private static final BigDecimal TRAIN_BASE  = new BigDecimal("1200");
    private static final BigDecimal BUS_BASE    = new BigDecimal("600");
    private static final BigDecimal CAR_BASE    = new BigDecimal("800");
    private static final BigDecimal BIKE_BASE   = new BigDecimal("300");

    public RecommendationDTOs.CostBreakdown calculate(
            List<Destination> destinations,
            int numberOfTravelers,
            LocalDate startDate,
            LocalDate endDate,
            TransportMode transportMode) {

        int days = (int) ChronoUnit.DAYS.between(startDate, endDate);
        if (days < 1) days = 1;

        // 1. Transport (round trip × number of travelers)
        BigDecimal transportPerPerson = getTransportCostPerPerson(transportMode)
                .multiply(BigDecimal.valueOf(2)); // round trip
        BigDecimal transportTotal = transportPerPerson
                .multiply(BigDecimal.valueOf(numberOfTravelers));

        // 2. Hotel (per person per night × travelers × days)
        BigDecimal hotelTotal = HOTEL_COST_PER_PERSON_PER_NIGHT
                .multiply(BigDecimal.valueOf(numberOfTravelers))
                .multiply(BigDecimal.valueOf(days));

        // 3. Food (per person per day × travelers × days)
        BigDecimal foodTotal = FOOD_COST_PER_PERSON_PER_DAY
                .multiply(BigDecimal.valueOf(numberOfTravelers))
                .multiply(BigDecimal.valueOf(days));

        // 4. Activity (avg destination cost × 30% × travelers)
        BigDecimal avgDestCost = destinations.stream()
                .map(Destination::getAvgCostPerPerson)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(Math.max(destinations.size(), 1)), 2, RoundingMode.HALF_UP);

        BigDecimal activityTotal = avgDestCost
                .multiply(new BigDecimal("0.30"))
                .multiply(BigDecimal.valueOf(numberOfTravelers));

        // 5. Misc (10% of all above)
        BigDecimal subtotal = transportTotal.add(hotelTotal).add(foodTotal).add(activityTotal);
        BigDecimal miscTotal = subtotal.multiply(MISC_PERCENTAGE)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal grandTotal = subtotal.add(miscTotal);
        BigDecimal totalPerPerson = grandTotal.divide(
                BigDecimal.valueOf(numberOfTravelers), 2, RoundingMode.HALF_UP);

        return RecommendationDTOs.CostBreakdown.builder()
                .transportCost(transportTotal.setScale(2, RoundingMode.HALF_UP))
                .hotelCost(hotelTotal.setScale(2, RoundingMode.HALF_UP))
                .foodCost(foodTotal.setScale(2, RoundingMode.HALF_UP))
                .activityCost(activityTotal.setScale(2, RoundingMode.HALF_UP))
                .miscCost(miscTotal)
                .totalPerPerson(totalPerPerson)
                .totalForGroup(grandTotal.setScale(2, RoundingMode.HALF_UP))
                .numberOfTravelers(numberOfTravelers)
                .numberOfDays(days)
                .build();
    }

    private BigDecimal getTransportCostPerPerson(TransportMode mode) {
        if (mode == null) return TRAIN_BASE;
        return switch (mode) {
            case FLIGHT -> FLIGHT_BASE;
            case TRAIN  -> TRAIN_BASE;
            case BUS    -> BUS_BASE;
            case CAR    -> CAR_BASE;
            case BIKE   -> BIKE_BASE;
            case MIXED  -> TRAIN_BASE.add(BUS_BASE).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        };
    }
}