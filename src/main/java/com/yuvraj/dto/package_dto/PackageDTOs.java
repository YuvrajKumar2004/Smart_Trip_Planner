package com.yuvraj.dto.package_dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PackageDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PackageRequest {

        @NotBlank(message = "Package title is required")
        private String title;

        @NotBlank(message = "Destination is required")
        private String destination;

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.0", message = "Price must be a positive number")
        private BigDecimal price;

        @NotBlank(message = "Duration is required")
        private String duration; // e.g., "5 Days / 4 Nights"

        private String description;

        private String imageUrl; // Can be base64 string or url

        @NotNull(message = "Available seats is required")
        @Min(value = 0, message = "Available seats cannot be negative")
        private Integer availableSeats;

        @NotNull(message = "Start date is required")
        private LocalDate startDate;

        @NotNull(message = "End date is required")
        private LocalDate endDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PackageResponse {
        private Long id;
        private String title;
        private String destination;
        private BigDecimal price;
        private String duration;
        private String description;
        private String imageUrl;
        private Integer availableSeats;
        private LocalDate startDate;
        private LocalDate endDate;
        private String createdAt;
        private String updatedAt;
    }
}
