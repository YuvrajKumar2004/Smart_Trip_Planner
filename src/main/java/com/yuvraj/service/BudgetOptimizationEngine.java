package com.yuvraj.service;

import com.yuvraj.dto.recommendation.RecommendationDTOs;
import com.yuvraj.entity.Destination;
import com.yuvraj.entity.TransportMode;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Budget Optimization Engine
 * ──────────────────────────
 * Compares estimated trip cost to the user's budget.
 *
 * Case 1 — Within budget:  returns breakdown + "you have surplus" message
 * Case 2 — Over budget:    returns breakdown + ranked optimization suggestions:
 *
 *   SUGGESTION TYPES (ordered by potential saving):
 *   1. Switch to cheaper transport (e.g. flight → train)
 *   2. Reduce duration by N days
 *   3. Remove most expensive destination(s)
 *   4. Reduce traveler count (if applicable)
 *   5. Budget accommodation (switch to shared/hostel)
 */
@Component
public class BudgetOptimizationEngine {

    private final BudgetCalculator calculator;

    public BudgetOptimizationEngine(BudgetCalculator calculator) {
        this.calculator = calculator;
    }

    public RecommendationDTOs.BudgetOptimizationResponse optimize(
            BigDecimal totalBudget,
            int numberOfTravelers,
            LocalDate startDate,
            LocalDate endDate,
            TransportMode preferredTransport,
            List<Destination> destinations) {

        // Calculate current estimated cost
        RecommendationDTOs.CostBreakdown breakdown = calculator.calculate(
                destinations, numberOfTravelers, startDate, endDate, preferredTransport);

        BigDecimal estimatedCost = breakdown.getTotalForGroup();
        BigDecimal difference    = totalBudget.subtract(estimatedCost);
        boolean withinBudget     = difference.compareTo(BigDecimal.ZERO) >= 0;

        List<RecommendationDTOs.OptimizationSuggestion> suggestions = new ArrayList<>();

        if (!withinBudget) {
            BigDecimal overBy = difference.abs();
            suggestions.addAll(generateSuggestions(
                    overBy, breakdown, numberOfTravelers,
                    startDate, endDate, preferredTransport, destinations));
        }

        String verdict = buildVerdict(withinBudget, difference, numberOfTravelers);

        return RecommendationDTOs.BudgetOptimizationResponse.builder()
                .withinBudget(withinBudget)
                .totalBudget(totalBudget)
                .estimatedCost(estimatedCost)
                .difference(difference)
                .costBreakdown(breakdown)
                .suggestions(suggestions)
                .verdict(verdict)
                .build();
    }

    // ── Suggestion Generator ──────────────────────────────────────────────────

    private List<RecommendationDTOs.OptimizationSuggestion> generateSuggestions(
            BigDecimal overBy,
            RecommendationDTOs.CostBreakdown breakdown,
            int numberOfTravelers,
            LocalDate startDate,
            LocalDate endDate,
            TransportMode currentTransport,
            List<Destination> destinations) {

        List<RecommendationDTOs.OptimizationSuggestion> suggestions = new ArrayList<>();
        int days = (int) ChronoUnit.DAYS.between(startDate, endDate);

        // ── Suggestion 1: Downgrade Transport ─────────────────────────────────
        TransportMode cheaper = getCheaperTransport(currentTransport);
        if (cheaper != null) {
            RecommendationDTOs.CostBreakdown altBreakdown = calculator.calculate(
                    destinations, numberOfTravelers, startDate, endDate, cheaper);
            BigDecimal saving = breakdown.getTotalForGroup()
                    .subtract(altBreakdown.getTotalForGroup());

            if (saving.compareTo(BigDecimal.ZERO) > 0) {
                suggestions.add(RecommendationDTOs.OptimizationSuggestion.builder()
                        .type("TRANSPORT")
                        .suggestion(String.format(
                                "Switch from %s to %s — saves ₹%.0f per trip",
                                currentTransport, cheaper, saving))
                        .potentialSaving(saving.setScale(2, RoundingMode.HALF_UP))
                        .build());
            }
        }

        // ── Suggestion 2: Reduce Duration ─────────────────────────────────────
        if (days > 2) {
            int reducedDays = days - 2;
            LocalDate newEndDate = startDate.plusDays(reducedDays);
            RecommendationDTOs.CostBreakdown altBreakdown = calculator.calculate(
                    destinations, numberOfTravelers, startDate, newEndDate, currentTransport);
            BigDecimal saving = breakdown.getTotalForGroup()
                    .subtract(altBreakdown.getTotalForGroup());

            suggestions.add(RecommendationDTOs.OptimizationSuggestion.builder()
                    .type("DURATION")
                    .suggestion(String.format(
                            "Reduce trip by 2 days (%d → %d days) — saves ₹%.0f",
                            days, reducedDays, saving))
                    .potentialSaving(saving.setScale(2, RoundingMode.HALF_UP))
                    .build());
        }

        // ── Suggestion 3: Remove Most Expensive Destination ───────────────────
        if (destinations.size() > 1) {
            Destination mostExpensive = destinations.stream()
                    .max((a, b) -> a.getAvgCostPerPerson()
                            .compareTo(b.getAvgCostPerPerson()))
                    .orElse(null);

            if (mostExpensive != null) {
                List<Destination> reduced = destinations.stream()
                        .filter(d -> !d.getId().equals(mostExpensive.getId()))
                        .toList();

                RecommendationDTOs.CostBreakdown altBreakdown = calculator.calculate(
                        reduced, numberOfTravelers, startDate, endDate, currentTransport);
                BigDecimal saving = breakdown.getTotalForGroup()
                        .subtract(altBreakdown.getTotalForGroup());

                suggestions.add(RecommendationDTOs.OptimizationSuggestion.builder()
                        .type("DESTINATION")
                        .suggestion(String.format(
                                "Remove '%s' (avg ₹%.0f/person) — saves ₹%.0f",
                                mostExpensive.getName(),
                                mostExpensive.getAvgCostPerPerson(), saving))
                        .potentialSaving(saving.setScale(2, RoundingMode.HALF_UP))
                        .build());
            }
        }

        // ── Suggestion 4: Budget Accommodation ───────────────────────────────
        BigDecimal hotelSaving = breakdown.getHotelCost()
                .multiply(new BigDecimal("0.40")); // 40% saving with budget hotel

        suggestions.add(RecommendationDTOs.OptimizationSuggestion.builder()
                .type("ACCOMMODATION")
                .suggestion(String.format(
                        "Switch to budget accommodation (hostels/guesthouses) — saves ₹%.0f",
                        hotelSaving))
                .potentialSaving(hotelSaving.setScale(2, RoundingMode.HALF_UP))
                .build());

        // ── Suggestion 5: Increase Budget ─────────────────────────────────────
        suggestions.add(RecommendationDTOs.OptimizationSuggestion.builder()
                .type("BUDGET")
                .suggestion(String.format(
                        "Increase your total budget by ₹%.0f (₹%.0f/person) to proceed as planned",
                        overBy,
                        overBy.divide(BigDecimal.valueOf(numberOfTravelers), 0, RoundingMode.CEILING)))
                .potentialSaving(BigDecimal.ZERO)
                .build());

        // Sort suggestions by potential saving descending
        suggestions.sort((a, b) -> b.getPotentialSaving().compareTo(a.getPotentialSaving()));
        return suggestions;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private TransportMode getCheaperTransport(TransportMode mode) {
        if (mode == null) return null;
        return switch (mode) {
            case FLIGHT -> TransportMode.TRAIN;
            case TRAIN  -> TransportMode.BUS;
            case CAR    -> TransportMode.BUS;
            case MIXED  -> TransportMode.TRAIN;
            default     -> null; // BUS / BIKE already cheapest
        };
    }

    private String buildVerdict(boolean withinBudget, BigDecimal difference, int travelers) {
        if (withinBudget) {
            BigDecimal surplusPerPerson = difference
                    .divide(BigDecimal.valueOf(travelers), 0, RoundingMode.FLOOR);
            return String.format(
                    "✅ Trip is within budget! You have ₹%.0f surplus (₹%.0f/person).",
                    difference, surplusPerPerson);
        } else {
            BigDecimal overBy = difference.abs();
            BigDecimal overPerPerson = overBy
                    .divide(BigDecimal.valueOf(travelers), 0, RoundingMode.CEILING);
            return String.format(
                    "⚠️ Trip exceeds your budget by ₹%.0f (₹%.0f/person). " +
                            "Review the suggestions below to bring costs down.",
                    overBy, overPerPerson);
        }
    }
}