package com.yuvraj.service;

import com.yuvraj.dto.trip.TripDTOs;
import com.yuvraj.entity.Destination;
import com.yuvraj.entity.PredefinedTrip;
import com.yuvraj.exception.ResourceNotFoundException;
import com.yuvraj.repository.PredefinedTripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PredefinedTripService {

    private final PredefinedTripRepository predefinedTripRepository;
    private final DestinationService       destinationService;

    // ── Admin: create ─────────────────────────────────────────────────────────

    @Transactional
    public TripDTOs.PredefinedTripResponse create(TripDTOs.PredefinedTripRequest request) {
        List<Destination> destinations = resolveDestinations(request.getDestinationIds());

        PredefinedTrip trip = PredefinedTrip.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .pricePerPerson(request.getPricePerPerson())
                .durationDays(request.getDurationDays())
                .bestSeason(request.getBestSeason())
                .transportMode(request.getTransportMode())
                .destinations(destinations)
                .imageUrls(request.getImageUrls() != null ? request.getImageUrls() : List.of())
                .active(true)
                .build();

        return toResponse(predefinedTripRepository.save(trip));
    }

    // ── Admin: update ─────────────────────────────────────────────────────────

    @Transactional
    public TripDTOs.PredefinedTripResponse update(Long id, TripDTOs.PredefinedTripRequest request) {
        PredefinedTrip trip = findById(id);

        trip.setTitle(request.getTitle());
        trip.setDescription(request.getDescription());
        trip.setCategory(request.getCategory());
        trip.setPricePerPerson(request.getPricePerPerson());
        trip.setDurationDays(request.getDurationDays());
        trip.setBestSeason(request.getBestSeason());
        trip.setTransportMode(request.getTransportMode());
        trip.setDestinations(resolveDestinations(request.getDestinationIds()));
        if (request.getImageUrls() != null) trip.setImageUrls(request.getImageUrls());

        return toResponse(predefinedTripRepository.save(trip));
    }

    // ── Admin: soft delete (deactivate) ──────────────────────────────────────

    @Transactional
    public void delete(Long id) {
        PredefinedTrip trip = findById(id);
        trip.setActive(false);
        predefinedTripRepository.save(trip);
    }

    // ── Public: list all active (paginated) ───────────────────────────────────

    public Page<TripDTOs.PredefinedTripResponse> getAll(Pageable pageable) {
        return predefinedTripRepository.findByActiveTrue(pageable)
                .map(this::toResponse);
    }

    // ── Public: get one ───────────────────────────────────────────────────────

    public TripDTOs.PredefinedTripResponse getOne(Long id) {
        return toResponse(findById(id));
    }

    // ── Public: search with filters ───────────────────────────────────────────

    public Page<TripDTOs.PredefinedTripResponse> search(
            TripDTOs.TripSearchFilter filter, Pageable pageable) {

        return predefinedTripRepository.search(
                filter.getKeyword(),
                filter.getCategory(),
                filter.getMinBudget(),
                filter.getMaxBudget(),
                filter.getBestSeason(),
                filter.getMaxDurationDays(),
                filter.getTransportMode(),
                pageable
        ).map(this::toResponse);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public PredefinedTrip findById(Long id) {
        return predefinedTripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Predefined trip not found: " + id));
    }

    private List<Destination> resolveDestinations(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        return ids.stream()
                .map(destinationService::findById)
                .collect(Collectors.toList());
    }

    private TripDTOs.PredefinedTripResponse toResponse(PredefinedTrip t) {
        return TripDTOs.PredefinedTripResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .category(t.getCategory().name())
                .pricePerPerson(t.getPricePerPerson())
                .durationDays(t.getDurationDays())
                .bestSeason(t.getBestSeason())
                .transportMode(t.getTransportMode() != null ? t.getTransportMode().name() : null)
                .destinations(t.getDestinations().stream()
                        .map(destinationService::toResponse)
                        .collect(Collectors.toList()))
                .imageUrls(t.getImageUrls())
                .active(t.isActive())
                .createdAt(t.getCreatedAt() != null ? t.getCreatedAt().toString() : null)
                .build();
    }
}