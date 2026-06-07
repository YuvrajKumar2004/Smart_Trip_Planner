package com.yuvraj.controller;

import com.yuvraj.dto.ApiResponse;
import com.yuvraj.dto.trip.TripDTOs;
import com.yuvraj.service.UserTripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class UserTripController {

    private final UserTripService userTripService;

    // POST /api/trips
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TripDTOs.UserTripResponse>> create(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody TripDTOs.UserTripRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Trip created",
                        userTripService.create(user.getUsername(), request)));
    }

    // GET /api/trips — list my trips
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<TripDTOs.UserTripResponse>>> getMyTrips(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success("Trips fetched",
                userTripService.getMyTrips(user.getUsername(), pageable)));
    }

    // GET /api/trips/{id}
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TripDTOs.UserTripResponse>> getOne(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(ApiResponse.success("Trip fetched",
                userTripService.getOne(id, user.getUsername())));
    }

    // PUT /api/trips/{id}
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TripDTOs.UserTripResponse>> update(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody TripDTOs.UserTripRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Trip updated",
                userTripService.update(id, user.getUsername(), request)));
    }

    // DELETE /api/trips/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {

        userTripService.delete(id, user.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Trip deleted", null));
    }

    // ── Status ─────────────────────────────────────────────────────────────────

    // PATCH /api/trips/{id}/status
    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TripDTOs.UserTripResponse>> updateStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody TripDTOs.TripStatusRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Status updated",
                userTripService.updateStatus(id, user.getUsername(), request)));
    }

    // ── Member management ──────────────────────────────────────────────────────

    // POST /api/trips/{id}/members
    @PostMapping("/{id}/members")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TripDTOs.UserTripResponse>> addMember(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody TripDTOs.MemberRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Member added",
                userTripService.addMember(id, user.getUsername(), request.getEmail())));
    }

    // DELETE /api/trips/{id}/members/{memberId}
    @DeleteMapping("/{id}/members/{memberId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TripDTOs.UserTripResponse>> removeMember(
            @PathVariable Long id,
            @PathVariable Long memberId,
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(ApiResponse.success("Member removed",
                userTripService.removeMember(id, user.getUsername(), memberId)));
    }
}