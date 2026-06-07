package com.yuvraj.controller;

import com.yuvraj.dto.ApiResponse;
import com.yuvraj.dto.trip.TripDTOs;
import com.yuvraj.service.DestinationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinations")
@RequiredArgsConstructor
public class DestinationController {

    private final DestinationService destinationService;

    // ── Public ────────────────────────────────────────────────────────────────

    // GET /api/destinations
    @GetMapping
    public ResponseEntity<ApiResponse<List<TripDTOs.DestinationResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Destinations fetched",
                destinationService.getAll()));
    }

    // GET /api/destinations/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TripDTOs.DestinationResponse>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Destination fetched",
                destinationService.getOne(id)));
    }

    // GET /api/destinations/search
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TripDTOs.DestinationResponse>>> search(
            @ModelAttribute TripDTOs.TripSearchFilter filter) {
        return ResponseEntity.ok(ApiResponse.success("Search results",
                destinationService.search(filter)));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    // POST /api/destinations
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TripDTOs.DestinationResponse>> create(
            @Valid @RequestBody TripDTOs.DestinationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Destination created",
                        destinationService.create(request)));
    }

    // PUT /api/destinations/{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TripDTOs.DestinationResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody TripDTOs.DestinationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Destination updated",
                destinationService.update(id, request)));
    }

    // DELETE /api/destinations/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        destinationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Destination deleted", null));
    }
}