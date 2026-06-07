package com.yuvraj.service;

import com.yuvraj.dto.recommendation.RecommendationDTOs;
import com.yuvraj.entity.PredefinedTrip;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Trip Scoring Engine
 * ───────────────────
 * Scores each predefined trip against the user's preferences on a 0–100 scale.
 *
 * Scoring weights (total = 100):
 *   Budget fit       → 35 pts  (most important: don't recommend what they can't afford)
 *   Category match   → 25 pts
 *   Duration fit     → 20 pts
 *   Transport match  → 10 pts
 *   Season match     → 10 pts
 *
 * A trip with score >= 60 is considered a good recommendation.
 */
@Component
public class TripScoringEngine {

    // ── Weights ───────────────────────────────────────────────────────────────
    private static final int WEIGHT_BUDGET    = 35;
    private static final int WEIGHT_CATEGORY  = 25;
    private static final int WEIGHT_DURATION  = 20;
    private static final int WEIGHT_TRANSPORT = 10;
    private static final int WEIGHT_SEASON    = 10;

    private static final int MINIMUM_SCORE = 40; // trips below this are excluded

    public RecommendationDTOs.RecommendationResponse score(
            PredefinedTrip trip,
            RecommendationDTOs.RecommendationRequest request) {

        List<String> matchReasons = new ArrayList<>();
        int totalScore = 0;

        int tripDays = trip.getDurationDays() != null ? trip.getDurationDays() : 0;
        int requestDays = (int) ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());

        // ── 1. Budget Score (35 pts) ──────────────────────────────────────────
        int budgetScore = scoreBudget(trip.getPricePerPerson(),
                request.getBudgetPerPerson(), matchReasons);
        totalScore += budgetScore;

        // ── 2. Category Score (25 pts) ────────────────────────────────────────
        int categoryScore = scoreCategory(trip, request, matchReasons);
        totalScore += categoryScore;

        // ── 3. Duration Score (20 pts) ────────────────────────────────────────
        int durationScore = scoreDuration(tripDays, requestDays, request, matchReasons);
        totalScore += durationScore;

        // ── 4. Transport Score (10 pts) ───────────────────────────────────────
        int transportScore = scoreTransport(trip, request, matchReasons);
        totalScore += transportScore;

        // ── 5. Season Score (10 pts) ──────────────────────────────────────────
        int seasonScore = scoreSeason(trip, request, matchReasons);
        totalScore += seasonScore;

        // Cap at 100
        totalScore = Math.min(totalScore, 100);

        BigDecimal totalCost = trip.getPricePerPerson()
                .multiply(BigDecimal.valueOf(request.getNumberOfTravelers()));

        List<String> destinationNames = trip.getDestinations().stream()
                .map(d -> d.getName())
                .toList();

        return RecommendationDTOs.RecommendationResponse.builder()
                .tripId(trip.getId())
                .tripTitle(trip.getTitle())
                .description(trip.getDescription())
                .category(trip.getCategory().name())
                .pricePerPerson(trip.getPricePerPerson())
                .totalCostForGroup(totalCost)
                .durationDays(trip.getDurationDays())
                .bestSeason(trip.getBestSeason())
                .transportMode(trip.getTransportMode() != null
                        ? trip.getTransportMode().name() : null)
                .destinations(destinationNames)
                .imageUrls(trip.getImageUrls())
                .matchScore(totalScore)
                .matchPercentage(totalScore + "%")
                .matchReasons(matchReasons)
                .build();
    }

    public boolean isGoodMatch(RecommendationDTOs.RecommendationResponse scored) {
        return scored.getMatchScore() >= MINIMUM_SCORE;
    }

    // ── Budget Scoring ────────────────────────────────────────────────────────

    /**
     * Full score   → trip cost <= budget (affordable)
     * Partial score → trip cost up to 20% over budget (close match)
     * Zero          → trip cost > 20% over budget (too expensive)
     *
     * Bonus points if trip is significantly under budget (great deal).
     */
    private int scoreBudget(BigDecimal tripCost, BigDecimal userBudget,
                            List<String> reasons) {
        if (tripCost == null || userBudget == null) return 0;

        double ratio = tripCost.divide(userBudget, 4, RoundingMode.HALF_UP).doubleValue();

        if (ratio <= 0.7) {
            reasons.add("Great value — well within your budget");
            return WEIGHT_BUDGET;
        } else if (ratio <= 1.0) {
            reasons.add("Fits within your budget");
            return WEIGHT_BUDGET;
        } else if (ratio <= 1.1) {
            reasons.add("Slightly over budget (within 10%)");
            return (int) (WEIGHT_BUDGET * 0.6);
        } else if (ratio <= 1.2) {
            reasons.add("Moderately over budget (within 20%)");
            return (int) (WEIGHT_BUDGET * 0.3);
        } else {
            reasons.add("Exceeds your budget significantly");
            return 0;
        }
    }

    // ── Category Scoring ──────────────────────────────────────────────────────

    private int scoreCategory(PredefinedTrip trip,
                              RecommendationDTOs.RecommendationRequest request,
                              List<String> reasons) {
        if (request.getPreferredCategory() == null) {
            return (int) (WEIGHT_CATEGORY * 0.5); // neutral if no preference
        }
        if (trip.getCategory() == request.getPreferredCategory()) {
            reasons.add("Matches your preferred category: " + request.getPreferredCategory().name());
            return WEIGHT_CATEGORY;
        }
        return 0;
    }

    // ── Duration Scoring ──────────────────────────────────────────────────────

    /**
     * Full score   → trip duration == available days (perfect fit)
     * Partial score → trip duration within ±2 days of available
     * Zero          → trip duration > available days (can't fit)
     */
    private int scoreDuration(int tripDays, int availableDays,
                              RecommendationDTOs.RecommendationRequest request,
                              List<String> reasons) {
        if (tripDays == 0) return (int) (WEIGHT_DURATION * 0.5);

        // Hard constraint: trip can't be longer than available time
        if (tripDays > availableDays) {
            reasons.add("Trip duration exceeds your available time");
            return 0;
        }

        if (request.getMaxDurationDays() != null && tripDays > request.getMaxDurationDays()) {
            reasons.add("Trip exceeds your max duration preference");
            return (int) (WEIGHT_DURATION * 0.3);
        }

        int diff = Math.abs(tripDays - availableDays);
        if (diff == 0) {
            reasons.add("Perfect duration match (" + tripDays + " days)");
            return WEIGHT_DURATION;
        } else if (diff <= 2) {
            reasons.add("Good duration fit (" + tripDays + " days)");
            return (int) (WEIGHT_DURATION * 0.8);
        } else {
            return (int) (WEIGHT_DURATION * 0.5);
        }
    }

    // ── Transport Scoring ─────────────────────────────────────────────────────

    private int scoreTransport(PredefinedTrip trip,
                               RecommendationDTOs.RecommendationRequest request,
                               List<String> reasons) {
        if (request.getPreferredTransport() == null || trip.getTransportMode() == null) {
            return (int) (WEIGHT_TRANSPORT * 0.5);
        }
        if (trip.getTransportMode() == request.getPreferredTransport()) {
            reasons.add("Matches your transport preference: " + request.getPreferredTransport().name());
            return WEIGHT_TRANSPORT;
        }
        return 0;
    }

    // ── Season Scoring ────────────────────────────────────────────────────────

    private int scoreSeason(PredefinedTrip trip,
                            RecommendationDTOs.RecommendationRequest request,
                            List<String> reasons) {
        if (trip.getBestSeason() == null) return (int) (WEIGHT_SEASON * 0.5);

        // Derive season from the start date month
        String inferredSeason = inferSeason(request.getStartDate());

        if (request.getPreferredSeason() != null &&
                trip.getBestSeason().toLowerCase()
                        .contains(request.getPreferredSeason().toLowerCase())) {
            reasons.add("Best season for this trip matches your travel dates");
            return WEIGHT_SEASON;
        }
        if (trip.getBestSeason().toLowerCase().contains(inferredSeason.toLowerCase())) {
            reasons.add("Good time of year to visit");
            return WEIGHT_SEASON;
        }
        return (int) (WEIGHT_SEASON * 0.3);
    }

    private String inferSeason(LocalDate date) {
        int month = date.getMonthValue();
        if (month >= 3 && month <= 5)  return "Spring";
        if (month >= 6 && month <= 8)  return "Summer";
        if (month >= 9 && month <= 11) return "Autumn";
        return "Winter";
    }
}