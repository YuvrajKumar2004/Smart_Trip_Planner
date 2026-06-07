package com.yuvraj.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "predefined_trips")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredefinedTrip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TripCategory category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerPerson;

    private Integer durationDays;

    private String bestSeason;

    @Enumerated(EnumType.STRING)
    private TransportMode transportMode;

    @ManyToMany
    @JoinTable(
            name = "predefined_trip_destinations",
            joinColumns = @JoinColumn(name = "trip_id"),
            inverseJoinColumns = @JoinColumn(name = "destination_id")
    )
    @Builder.Default
    private List<Destination> destinations = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "predefined_trip_images",
            joinColumns = @JoinColumn(name = "trip_id"))
    @Column(name = "image_url",columnDefinition = "LONGTEXT")
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();

    private boolean active = true;

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