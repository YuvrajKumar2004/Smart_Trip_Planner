package com.yuvraj.dto.recommendation;

import com.yuvraj.entity.TransportMode;
import com.yuvraj.entity.TripCategory;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class RecommendationDTOs {

    // =========================================================================
    // RECOMMENDATION REQUEST
    // =========================================================================

    @Data
    public static class RecommendationRequest {

        @NotNull(message = "Budget is required")
        @DecimalMin("0.0")
        private BigDecimal budgetPerPerson;

        @NotNull(message = "Start date is required")
        private LocalDate startDate;

        @NotNull(message = "End date is required")
        private LocalDate endDate;

        @Min(1)
        @NotNull
        private Integer numberOfTravelers;

        private TripCategory preferredCategory;

        private TransportMode preferredTransport;

        // Preferred states / regions
        private List<String> preferredStates;

        // Maximum trip duration in days
        private Integer maxDurationDays;

        private String preferredSeason;
    }

    // =========================================================================
    // RECOMMENDATION RESPONSE
    // =========================================================================

    @Data
    @Builder
    public static class RecommendationResponse {
        private Long tripId;
        private String tripTitle;
        private String description;
        private String category;
        private BigDecimal pricePerPerson;
        private BigDecimal totalCostForGroup;
        private Integer durationDays;
        private String bestSeason;
        private String transportMode;
        private List<String> destinations;
        private List<String> imageUrls;

        // Scoring details
        private int matchScore;             // 0–100
        private String matchPercentage;     // e.g. "87%"
        private List<String> matchReasons;  // human-readable reasons
    }

    // =========================================================================
    // BUDGET OPTIMIZATION REQUEST
    // =========================================================================

    @Data
    public static class BudgetOptimizationRequest {

        @NotNull
        @DecimalMin("0.0")
        private BigDecimal totalBudget;

        @Min(1)
        @NotNull
        private Integer numberOfTravelers;

        @NotNull
        private LocalDate startDate;

        @NotNull
        private LocalDate endDate;

        private TransportMode preferredTransport;

        private TripCategory tripCategory;

        // Destination IDs user wants to visit
        @NotEmpty
        private List<Long> destinationIds;
    }

    // =========================================================================
    // BUDGET OPTIMIZATION RESPONSE
    // =========================================================================

    @Data
    @Builder
    public static class BudgetOptimizationResponse {
        private boolean withinBudget;
        private BigDecimal totalBudget;
        private BigDecimal estimatedCost;
        private BigDecimal difference;         // positive = surplus, negative = over budget

        private CostBreakdown costBreakdown;
        private List<OptimizationSuggestion> suggestions;
        private String verdict;                // summary message
    }

    @Data
    @Builder
    public static class CostBreakdown {
        private BigDecimal transportCost;
        private BigDecimal hotelCost;
        private BigDecimal foodCost;
        private BigDecimal activityCost;
        private BigDecimal miscCost;
        private BigDecimal totalPerPerson;
        private BigDecimal totalForGroup;
        private int numberOfTravelers;
        private int numberOfDays;
    }

    @Data
    @Builder
    public static class OptimizationSuggestion {
        private String type;           // TRANSPORT / ACCOMMODATION / DESTINATION / DURATION
        private String suggestion;     // human-readable text
        private BigDecimal potentialSaving;
    }
}