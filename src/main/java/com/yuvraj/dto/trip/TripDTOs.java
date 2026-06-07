package com.yuvraj.dto.trip;

import com.yuvraj.entity.TransportMode;
import com.yuvraj.entity.TripCategory;
import com.yuvraj.entity.TripStatus;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class TripDTOs {

    // =========================================================================
    // DESTINATION DTOs
    // =========================================================================

    @Data
    public static class DestinationRequest {
        @NotBlank
        private String name;

        private String description;

        @NotNull
        private TripCategory category;

        @NotNull
        @DecimalMin("0.0")
        private BigDecimal avgCostPerPerson;

        private String bestSeason;
        private String recommendedTransport;
        private Integer recommendedDurationDays;
        private List<String> imageUrls;
        private String state;
        private String country;
    }

    @Data
    @Builder
    public static class DestinationResponse {
        private Long id;
        private String name;
        private String description;
        private String category;
        private BigDecimal avgCostPerPerson;
        private String bestSeason;
        private String recommendedTransport;
        private Integer recommendedDurationDays;
        private List<String> imageUrls;
        private String state;
        private String country;
        private String createdAt;
    }

    // =========================================================================
    // PREDEFINED TRIP DTOs (Admin)
    // =========================================================================

    @Data
    public static class PredefinedTripRequest {
        @NotBlank
        private String title;

        private String description;

        @NotNull
        private TripCategory category;

        @NotNull
        @DecimalMin("0.0")
        private BigDecimal pricePerPerson;

        @Min(1)
        private Integer durationDays;

        private String bestSeason;
        private TransportMode transportMode;
        private List<Long> destinationIds;
        private List<String> imageUrls;
    }

    @Data
    @Builder
    public static class PredefinedTripResponse {
        private Long id;
        private String title;
        private String description;
        private String category;
        private BigDecimal pricePerPerson;
        private Integer durationDays;
        private String bestSeason;
        private String transportMode;
        private List<DestinationResponse> destinations;
        private List<String> imageUrls;
        private boolean active;
        private String createdAt;
    }

    // =========================================================================
    // USER TRIP DTOs
    // =========================================================================

    @Data
    public static class UserTripRequest {
        @NotBlank
        private String title;

        private String description;

        @NotNull
        @DecimalMin("0.0")
        private BigDecimal minBudget;

        @NotNull
        @DecimalMin("0.0")
        private BigDecimal maxBudget;

        @NotNull
        @FutureOrPresent
        private LocalDate startDate;

        @NotNull
        private LocalDate endDate;

        @Min(1)
        @NotNull
        private Integer numberOfTravelers;

        private TransportMode transportMode;

        @NotNull
        private TripCategory tripType;

        private List<Long> destinationIds;
    }

    @Data
    @Builder
    public static class UserTripResponse {
        private Long id;
        private String title;
        private String description;
        private String createdBy;
        private List<MemberResponse> members;
        private List<DestinationResponse> destinations;
        private BigDecimal minBudget;
        private BigDecimal maxBudget;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer numberOfTravelers;
        private String transportMode;
        private String tripType;
        private String status;
        private String createdAt;
    }

    @Data
    @Builder
    public static class MemberResponse {
        private Long id;
        private String name;
        private String email;
    }

    // ── Add / remove member ───────────────────────────────────────────────────
    @Data
    public static class MemberRequest {
        @NotBlank(message = "Email cannot be blank")
        @Email(message = "Invalid email format")
        private String email;
    }

    // ── Update trip status ────────────────────────────────────────────────────
    @Data
    public static class TripStatusRequest {
        @NotNull
        private TripStatus status;
    }

    // =========================================================================
    // SEARCH / FILTER
    // =========================================================================

    @Data
    public static class TripSearchFilter {
        private String keyword;          // searches title + description
        private TripCategory category;
        private BigDecimal minBudget;
        private BigDecimal maxBudget;
        private String bestSeason;
        private Integer maxDurationDays;
        private TransportMode transportMode;
        private String state;
    }
}