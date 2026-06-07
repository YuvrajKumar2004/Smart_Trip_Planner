package com.yuvraj.controller;

import com.yuvraj.dto.ApiResponse;
import com.yuvraj.dto.trip.TripDTOs;
import com.yuvraj.service.PredefinedTripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/predefined-trips")
@RequiredArgsConstructor
public class PredefinedTripController {

    private final PredefinedTripService predefinedTripService;

    // ── Public ────────────────────────────────────────────────────────────────

    // GET /api/predefined-trips?page=0&size=10&sort=pricePerPerson,asc
    @GetMapping
    public ResponseEntity<ApiResponse<Page<TripDTOs.PredefinedTripResponse>>> getAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(sortParts.length > 1 ? sortParts[1] : "desc"),
                        sortParts[0]));

        return ResponseEntity.ok(ApiResponse.success("Trips fetched",
                predefinedTripService.getAll(pageable)));
    }

    // GET /api/predefined-trips/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TripDTOs.PredefinedTripResponse>> getOne(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Trip fetched",
                predefinedTripService.getOne(id)));
    }

    // GET /api/predefined-trips/search
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<TripDTOs.PredefinedTripResponse>>> search(
            @ModelAttribute TripDTOs.TripSearchFilter filter,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success("Search results",
                predefinedTripService.search(filter, pageable)));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    // POST /api/predefined-trips
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TripDTOs.PredefinedTripResponse>> create(
            @Valid @RequestBody TripDTOs.PredefinedTripRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Trip created",
                        predefinedTripService.create(request)));
    }

    // PUT /api/predefined-trips/{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<TripDTOs.PredefinedTripResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody TripDTOs.PredefinedTripRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Trip updated",
                predefinedTripService.update(id, request)));
    }

    // DELETE /api/predefined-trips/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        predefinedTripService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Trip deactivated", null));
    }
}