package com.yuvraj.service;

import com.yuvraj.dto.recommendation.RecommendationDTOs;
import com.yuvraj.entity.Destination;
import com.yuvraj.entity.PredefinedTrip;
import com.yuvraj.exception.ResourceNotFoundException;
import com.yuvraj.repository.DestinationRepository;
import com.yuvraj.repository.PredefinedTripRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final PredefinedTripRepository tripRepository;
    private final DestinationRepository    destinationRepository;
    private final TripScoringEngine        scoringEngine;
    private final BudgetOptimizationEngine budgetEngine;
    private final BudgetCalculator         budgetCalculator;

    // =========================================================================
    // TRIP RECOMMENDATIONS
    // =========================================================================

    /**
     * Recommendation flow:
     *  1. Load all active predefined trips (capped at 100 for performance)
     *  2. Score each trip against user preferences (0–100)
     *  3. Filter out trips below the minimum score threshold (40)
     *  4. Sort by score descending
     *  5. Return top N results
     *
     * @return ranked list of matching trips with scores and match reasons
     */
    public List<RecommendationDTOs.RecommendationResponse> recommend(
            RecommendationDTOs.RecommendationRequest request) {

        // Load all active trips
        List<PredefinedTrip> allTrips = tripRepository
                .findByActiveTrue(PageRequest.of(0, 100))
                .getContent();

        log.info("Scoring {} trips for recommendation", allTrips.size());

        return allTrips.stream()
                // Score each trip
                .map(trip -> scoringEngine.score(trip, request))
                // Filter out poor matches
                .filter(scoringEngine::isGoodMatch)
                // Sort by score descending
                .sorted(Comparator.comparingInt(
                        RecommendationDTOs.RecommendationResponse::getMatchScore).reversed())
                // Return top 10
                .limit(10)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // BUDGET OPTIMIZATION
    // =========================================================================

    /**
     * Budget optimization flow:
     *  1. Resolve destination entities from IDs
     *  2. Run BudgetCalculator to estimate all cost components
     *  3. Compare against user's total budget
     *  4. If over budget: generate ranked optimization suggestions
     *  5. Return full breakdown + verdict + suggestions
     */
    public RecommendationDTOs.BudgetOptimizationResponse optimizeBudget(
            RecommendationDTOs.BudgetOptimizationRequest request) {

        List<Destination> destinations = request.getDestinationIds().stream()
                .map(id -> destinationRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Destination not found: " + id)))
                .collect(Collectors.toList());

        return budgetEngine.optimize(
                request.getTotalBudget(),
                request.getNumberOfTravelers(),
                request.getStartDate(),
                request.getEndDate(),
                request.getPreferredTransport(),
                destinations
        );
    }

    // =========================================================================
    // QUICK COST ESTIMATE (no optimization, just breakdown)
    // =========================================================================

    public RecommendationDTOs.CostBreakdown estimateCost(
            RecommendationDTOs.BudgetOptimizationRequest request) {

        List<Destination> destinations = request.getDestinationIds().stream()
                .map(id -> destinationRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Destination not found: " + id)))
                .collect(Collectors.toList());

        return budgetCalculator.calculate(
                destinations,
                request.getNumberOfTravelers(),
                request.getStartDate(),
                request.getEndDate(),
                request.getPreferredTransport()
        );
    }
}