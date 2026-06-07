package com.yuvraj.service;

import com.yuvraj.dto.trip.TripDTOs;
import com.yuvraj.entity.Destination;
import com.yuvraj.exception.ResourceNotFoundException;
import com.yuvraj.repository.DestinationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DestinationService {

    private final DestinationRepository destinationRepository;

    // ── Admin: create ─────────────────────────────────────────────────────────

    @Transactional
    public TripDTOs.DestinationResponse create(TripDTOs.DestinationRequest request) {
        Destination destination = Destination.builder()
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .avgCostPerPerson(request.getAvgCostPerPerson())
                .bestSeason(request.getBestSeason())
                .recommendedTransport(request.getRecommendedTransport())
                .recommendedDurationDays(request.getRecommendedDurationDays())
                .imageUrls(request.getImageUrls() != null ? request.getImageUrls() : List.of())
                .state(request.getState())
                .country(request.getCountry())
                .build();

        return toResponse(destinationRepository.save(destination));
    }

    // ── Admin: update ─────────────────────────────────────────────────────────

    @Transactional
    public TripDTOs.DestinationResponse update(Long id, TripDTOs.DestinationRequest request) {
        Destination destination = findById(id);

        destination.setName(request.getName());
        destination.setDescription(request.getDescription());
        destination.setCategory(request.getCategory());
        destination.setAvgCostPerPerson(request.getAvgCostPerPerson());
        destination.setBestSeason(request.getBestSeason());
        destination.setRecommendedTransport(request.getRecommendedTransport());
        destination.setRecommendedDurationDays(request.getRecommendedDurationDays());
        if (request.getImageUrls() != null) destination.setImageUrls(request.getImageUrls());
        destination.setState(request.getState());
        destination.setCountry(request.getCountry());

        return toResponse(destinationRepository.save(destination));
    }

    // ── Admin: delete ─────────────────────────────────────────────────────────

    @Transactional
    public void delete(Long id) {
        destinationRepository.delete(findById(id));
    }

    // ── Public: get all / get one ─────────────────────────────────────────────

    public List<TripDTOs.DestinationResponse> getAll() {
        return destinationRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TripDTOs.DestinationResponse getOne(Long id) {
        return toResponse(findById(id));
    }

    // ── Public: search ────────────────────────────────────────────────────────

    public List<TripDTOs.DestinationResponse> search(TripDTOs.TripSearchFilter filter) {
        return destinationRepository.search(
                filter.getKeyword(),
                filter.getCategory(),
                filter.getMaxBudget(),
                filter.getBestSeason()
        ).stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public Destination findById(Long id) {
        return destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found: " + id));
    }

    public TripDTOs.DestinationResponse toResponse(Destination d) {
        return TripDTOs.DestinationResponse.builder()
                .id(d.getId())
                .name(d.getName())
                .description(d.getDescription())
                .category(d.getCategory().name())
                .avgCostPerPerson(d.getAvgCostPerPerson())
                .bestSeason(d.getBestSeason())
                .recommendedTransport(d.getRecommendedTransport())
                .recommendedDurationDays(d.getRecommendedDurationDays())
                .imageUrls(d.getImageUrls())
                .state(d.getState())
                .country(d.getCountry())
                .createdAt(d.getCreatedAt() != null ? d.getCreatedAt().toString() : null)
                .build();
    }
}