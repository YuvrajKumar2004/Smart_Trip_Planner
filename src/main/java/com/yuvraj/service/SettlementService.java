package com.yuvraj.service;

import com.yuvraj.dto.expense.ExpenseDTOs;
import com.yuvraj.entity.*;
import com.yuvraj.exception.ResourceNotFoundException;
import com.yuvraj.exception.UnauthorizedException;
import com.yuvraj.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final SettlementRepository   settlementRepository;
    private final UserRepository         userRepository;
    private final UserTripRepository     tripRepository;
    private final ExpenseSplitRepository splitRepository;
    private final DebtSimplificationEngine debtEngine;
    private final ExpenseRepository      expenseRepository;

    // ── Record a settlement payment ───────────────────────────────────────────

    @Transactional
    public ExpenseDTOs.SettlementResponse settle(String fromEmail,
                                                 ExpenseDTOs.SettleRequest request) {
        User fromUser = findUser(fromEmail);
        User toUser   = findUserById(request.getToUserId());
        UserTrip trip = findTrip(request.getTripId());

        assertMember(trip, fromEmail);

        Settlement settlement = Settlement.builder()
                .fromUser(fromUser)
                .toUser(toUser)
                .trip(trip)
                .amount(request.getAmount())
                .status(SettlementStatus.COMPLETED)
                .note(request.getNote())
                .settledAt(LocalDateTime.now())
                .build();

        // Mark individual expense splits as settled where applicable
        markSplitsAsSettled(fromUser.getId(), toUser.getId(), trip.getId(), request.getAmount());

        return toSettlementResponse(settlementRepository.save(settlement));
    }

    // ── Get pending settlements for a user ────────────────────────────────────

    public List<ExpenseDTOs.SettlementResponse> getPending(String email) {
        User user = findUser(email);
        return settlementRepository.findPendingByUser(user.getId()).stream()
                .map(this::toSettlementResponse)
                .collect(Collectors.toList());
    }

    // ── Get settlement history for a trip ─────────────────────────────────────

    public List<ExpenseDTOs.SettlementResponse> getTripSettlements(Long tripId, String email) {
        assertMember(findTrip(tripId), email);
        User user = findUser(email);
        return settlementRepository.findByTripAndUser(tripId, user.getId()).stream()
                .map(this::toSettlementResponse)
                .collect(Collectors.toList());
    }

    // ── Mark individual expense splits as settled ─────────────────────────────

    /**
     * After a user pays another user, mark their splits on that trip as settled.
     * Greedy: settle oldest splits first up to the payment amount.
     */
    @Transactional
    public void markSplitsAsSettled(Long fromUserId, Long toUserId, Long tripId,
                                    java.math.BigDecimal paymentAmount) {
        List<ExpenseSplit> unsettledSplits = splitRepository
                .findByTripAndUser(tripId, fromUserId)
                .stream()
                .filter(s -> !s.isSettled()
                        && s.getExpense().getPaidBy().getId().equals(toUserId))
                .collect(Collectors.toList());

        java.math.BigDecimal remaining = paymentAmount;

        for (ExpenseSplit split : unsettledSplits) {
            if (remaining.compareTo(java.math.BigDecimal.ZERO) <= 0) break;

            if (remaining.compareTo(split.getAmountOwed()) >= 0) {
                split.setSettled(true);
                remaining = remaining.subtract(split.getAmountOwed());
            }
            splitRepository.save(split);
        }
    }

    // ── Response Mapper ───────────────────────────────────────────────────────

    private ExpenseDTOs.SettlementResponse toSettlementResponse(Settlement s) {
        return ExpenseDTOs.SettlementResponse.builder()
                .id(s.getId())
                .fromUserId(s.getFromUser().getId())
                .fromUserName(s.getFromUser().getName())
                .toUserId(s.getToUser().getId())
                .toUserName(s.getToUser().getName())
                .tripId(s.getTrip().getId())
                .amount(s.getAmount())
                .status(s.getStatus().name())
                .note(s.getNote())
                .createdAt(s.getCreatedAt().toString())
                .settledAt(s.getSettledAt() != null ? s.getSettledAt().toString() : null)
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private UserTrip findTrip(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found: " + id));
    }

    private void assertMember(UserTrip trip, String email) {
        boolean isMember = trip.getCreatedBy().getEmail().equals(email)
                || trip.getMembers().stream().anyMatch(m -> m.getEmail().equals(email));
        if (!isMember) throw new UnauthorizedException("You are not a member of this trip");
    }
}