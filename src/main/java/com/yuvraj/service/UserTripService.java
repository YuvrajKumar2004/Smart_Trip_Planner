package com.yuvraj.service;

import com.yuvraj.dto.trip.TripDTOs;
import com.yuvraj.entity.*;
import com.yuvraj.exception.ResourceNotFoundException;
import com.yuvraj.exception.UnauthorizedException;
import com.yuvraj.repository.UserRepository;
import com.yuvraj.repository.UserTripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserTripService {

    private final UserTripRepository  userTripRepository;
    private final UserRepository      userRepository;
    private final DestinationService  destinationService;

    // ── Create trip ───────────────────────────────────────────────────────────

    @Transactional
    public TripDTOs.UserTripResponse create(String creatorEmail, TripDTOs.UserTripRequest request) {
        User creator = findUser(creatorEmail);

        UserTrip trip = UserTrip.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .createdBy(creator)
                .minBudget(request.getMinBudget())
                .maxBudget(request.getMaxBudget())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .numberOfTravelers(request.getNumberOfTravelers())
                .transportMode(request.getTransportMode())
                .tripType(request.getTripType())
                .status(TripStatus.PLANNING)
                .destinations(resolveDestinations(request.getDestinationIds()))
                .build();

        // Creator is automatically a member
        trip.getMembers().add(creator);

        return toResponse(userTripRepository.save(trip));
    }

    // ── Update trip ───────────────────────────────────────────────────────────

    @Transactional
    public TripDTOs.UserTripResponse update(Long tripId, String email, TripDTOs.UserTripRequest request) {
        UserTrip trip = findById(tripId);
        assertCreator(trip, email);

        trip.setTitle(request.getTitle());
        trip.setDescription(request.getDescription());
        trip.setMinBudget(request.getMinBudget());
        trip.setMaxBudget(request.getMaxBudget());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        trip.setNumberOfTravelers(request.getNumberOfTravelers());
        trip.setTransportMode(request.getTransportMode());
        trip.setTripType(request.getTripType());
        trip.setDestinations(resolveDestinations(request.getDestinationIds()));

        return toResponse(userTripRepository.save(trip));
    }

    // ── Delete trip ───────────────────────────────────────────────────────────

    @Transactional
    public void delete(Long tripId, String email) {
        UserTrip trip = findById(tripId);
        assertCreator(trip, email);
        userTripRepository.delete(trip);
    }

    // ── Get trips for current user ────────────────────────────────────────────

    public Page<TripDTOs.UserTripResponse> getMyTrips(String email, Pageable pageable) {
        return userTripRepository.findAllByMemberEmail(email, pageable)
                .map(this::toResponse);
    }

    public TripDTOs.UserTripResponse getOne(Long id, String email) {
        UserTrip trip = findById(id);
        assertMember(trip, email);
        return toResponse(trip);
    }

    // ── Member management ─────────────────────────────────────────────────────

    @Transactional
    public TripDTOs.UserTripResponse addMember(Long tripId, String creatorEmail, String memberEmail) {
        UserTrip trip = findById(tripId);
        assertCreator(trip, creatorEmail);

        User newMember = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + memberEmail));

        // Prevent adding creator as member again
        if (newMember.getId().equals(trip.getCreatedBy().getId())) {
            throw new IllegalArgumentException("The trip creator is already a member");
        }

        boolean alreadyMember = trip.getMembers().stream()
                .anyMatch(m -> m.getId().equals(newMember.getId()));

        if (!alreadyMember) {
            trip.getMembers().add(newMember);
            userTripRepository.save(trip);
        } else {
            throw new IllegalArgumentException("User is already a member of this trip");
        }
        return toResponse(trip);
    }

    @Transactional
    public TripDTOs.UserTripResponse removeMember(Long tripId, String creatorEmail, Long memberId) {
        UserTrip trip = findById(tripId);
        assertCreator(trip, creatorEmail);

        if (trip.getCreatedBy().getId().equals(memberId)) {
            throw new IllegalArgumentException("Cannot remove the trip creator");
        }

        trip.getMembers().removeIf(m -> m.getId().equals(memberId));
        return toResponse(userTripRepository.save(trip));
    }

    // ── Status update ─────────────────────────────────────────────────────────

    @Transactional
    public TripDTOs.UserTripResponse updateStatus(Long tripId, String email,
                                                  TripDTOs.TripStatusRequest request) {
        UserTrip trip = findById(tripId);
        assertCreator(trip, email);
        trip.setStatus(request.getStatus());
        return toResponse(userTripRepository.save(trip));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public UserTrip findById(Long id) {
        return userTripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found: " + id));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private List<Destination> resolveDestinations(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        return ids.stream().map(destinationService::findById).collect(Collectors.toList());
    }

    private void assertCreator(UserTrip trip, String email) {
        if (!trip.getCreatedBy().getEmail().equals(email)) {
            throw new UnauthorizedException("Only the trip creator can perform this action");
        }
    }

    private void assertMember(UserTrip trip, String email) {
        boolean isMember = trip.getCreatedBy().getEmail().equals(email)
                || trip.getMembers().stream().anyMatch(m -> m.getEmail().equals(email));
        if (!isMember) {
            throw new UnauthorizedException("You are not a member of this trip");
        }
    }

    public TripDTOs.UserTripResponse toResponse(UserTrip t) {
        return TripDTOs.UserTripResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .createdBy(t.getCreatedBy().getName())
                .members(t.getMembers().stream()
                        .map(m -> TripDTOs.MemberResponse.builder()
                                .id(m.getId()).name(m.getName()).email(m.getEmail()).build())
                        .collect(Collectors.toList()))
                .destinations(t.getDestinations().stream()
                        .map(destinationService::toResponse)
                        .collect(Collectors.toList()))
                .minBudget(t.getMinBudget())
                .maxBudget(t.getMaxBudget())
                .startDate(t.getStartDate())
                .endDate(t.getEndDate())
                .numberOfTravelers(t.getNumberOfTravelers())
                .transportMode(t.getTransportMode() != null ? t.getTransportMode().name() : null)
                .tripType(t.getTripType().name())
                .status(t.getStatus().name())
                .createdAt(t.getCreatedAt() != null ? t.getCreatedAt().toString() : null)
                .build();
    }
}