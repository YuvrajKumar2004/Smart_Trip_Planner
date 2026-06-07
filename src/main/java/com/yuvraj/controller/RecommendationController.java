package com.yuvraj.controller;

import com.yuvraj.dto.ApiResponse;
import com.yuvraj.dto.recommendation.RecommendationDTOs;
import com.yuvraj.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    /**
     * POST /api/trips/recommend
     * Returns top matching predefined trips ranked by score (0–100).
     * Each result includes match percentage + human-readable match reasons.
     */
    @PostMapping("/recommend")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<RecommendationDTOs.RecommendationResponse>>> recommend(
            @Valid @RequestBody RecommendationDTOs.RecommendationRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Recommendations ready",
                recommendationService.recommend(request)));
    }

    /**
     * POST /api/trips/budget/optimize
     * Analyzes whether a planned trip fits the budget.
     * If over budget: returns ranked suggestions to reduce cost.
     * If within budget: returns surplus amount + full cost breakdown.
     */
    @PostMapping("/budget/optimize")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RecommendationDTOs.BudgetOptimizationResponse>> optimizeBudget(
            @Valid @RequestBody RecommendationDTOs.BudgetOptimizationRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Budget analysis complete",
                recommendationService.optimizeBudget(request)));
    }

    /**
     * POST /api/trips/budget/estimate
     * Quick cost breakdown without optimization suggestions.
     * Useful for showing users a cost preview before creating a trip.
     */
    @PostMapping("/budget/estimate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RecommendationDTOs.CostBreakdown>> estimateCost(
            @Valid @RequestBody RecommendationDTOs.BudgetOptimizationRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Cost estimate ready",
                recommendationService.estimateCost(request)));
    }
}