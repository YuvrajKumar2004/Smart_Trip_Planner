package com.yuvraj.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_trips")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTrip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // ── Creator ───────────────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    // ── Members ───────────────────────────────────────────────────────────────
    @ManyToMany
    @JoinTable(
            name = "trip_members",
            joinColumns = @JoinColumn(name = "trip_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private List<User> members = new ArrayList<>();

    // ── Destinations ──────────────────────────────────────────────────────────
    @ManyToMany
    @JoinTable(
            name = "user_trip_destinations",
            joinColumns = @JoinColumn(name = "trip_id"),
            inverseJoinColumns = @JoinColumn(name = "destination_id")
    )
    @Builder.Default
    private List<Destination> destinations = new ArrayList<>();

    // ── Budget ────────────────────────────────────────────────────────────────
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal minBudget;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal maxBudget;

    // ── Trip details ──────────────────────────────────────────────────────────
    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    private Integer numberOfTravelers;

    @Enumerated(EnumType.STRING)
    private TransportMode transportMode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TripCategory tripType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TripStatus status = TripStatus.PLANNING;

    // ── Timestamps ────────────────────────────────────────────────────────────
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