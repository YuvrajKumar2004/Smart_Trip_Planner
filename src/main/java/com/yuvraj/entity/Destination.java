package com.yuvraj.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "destinations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Destination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TripCategory category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal avgCostPerPerson;

    private String bestSeason;           // e.g. "October–March"

    private String recommendedTransport; // e.g. "Flight + Cab"

    private Integer recommendedDurationDays;

    @ElementCollection
    @CollectionTable(name = "destination_images",
            joinColumns = @JoinColumn(name = "destination_id"))
    @Column(name = "image_url",columnDefinition = "LONGTEXT")
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();

    private String state;
    private String country;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}