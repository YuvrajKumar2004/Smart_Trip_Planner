package com.yuvraj.controller;

import com.yuvraj.dto.ApiResponse;
import com.yuvraj.dto.expense.ExpenseDTOs;
import com.yuvraj.service.SettlementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settlements")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;

    // POST /api/settlements/pay
    @PostMapping("/pay")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ExpenseDTOs.SettlementResponse>> settle(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody ExpenseDTOs.SettleRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Settlement recorded",
                        settlementService.settle(user.getUsername(), request)));
    }

    // GET /api/settlements/pending
    @GetMapping("/pending")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ExpenseDTOs.SettlementResponse>>> getPending(
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(ApiResponse.success("Pending settlements",
                settlementService.getPending(user.getUsername())));
    }

    // GET /api/settlements/trip/{tripId}
    @GetMapping("/trip/{tripId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ExpenseDTOs.SettlementResponse>>> getTripSettlements(
            @PathVariable Long tripId,
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(ApiResponse.success("Settlement history",
                settlementService.getTripSettlements(tripId, user.getUsername())));
    }
}