package com.yuvraj.service;

import com.yuvraj.dto.expense.ExpenseDTOs;
import com.yuvraj.entity.*;
import com.yuvraj.exception.ResourceNotFoundException;
import com.yuvraj.exception.UnauthorizedException;
import com.yuvraj.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository       expenseRepository;
    private final ExpenseSplitRepository  splitRepository;
    private final UserRepository          userRepository;
    private final UserTripRepository      tripRepository;
    private final DebtSimplificationEngine debtEngine;

    // ── Add Expense ───────────────────────────────────────────────────────────

    @Transactional
    public ExpenseDTOs.ExpenseResponse addExpense(Long tripId, String payerEmail,
                                                  ExpenseDTOs.AddExpenseRequest request) {
        UserTrip trip = findTrip(tripId);
        User payer    = findUser(payerEmail);
        assertMember(trip, payerEmail);

        List<User> participants = request.getParticipantIds().stream()
                .map(this::findUserById)
                .collect(Collectors.toList());

        // Build expense
        Expense expense = Expense.builder()
                .description(request.getDescription())
                .amount(request.getAmount())
                .category(request.getCategory())
                .splitType(request.getSplitType())
                .paidBy(payer)
                .trip(trip)
                .build();

        // Build splits based on split type
        List<ExpenseSplit> splits = buildSplits(expense, request, participants);

        // Validate split totals match expense amount
        validateSplitTotal(splits, request.getAmount(), request.getSplitType());

        expense.setSplits(splits);
        return toExpenseResponse(expenseRepository.save(expense));
    }

    // ── Get Expenses for Trip ─────────────────────────────────────────────────

    public List<ExpenseDTOs.ExpenseResponse> getTripExpenses(Long tripId, String email) {
        assertMember(findTrip(tripId), email);
        return expenseRepository.findByTripId(tripId).stream()
                .map(this::toExpenseResponse)
                .collect(Collectors.toList());
    }

    // ── Delete Expense ────────────────────────────────────────────────────────

    @Transactional
    public void deleteExpense(Long expenseId, String email) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));

        if (!expense.getPaidBy().getEmail().equals(email)) {
            throw new UnauthorizedException("Only the expense payer can delete it");
        }
        expenseRepository.delete(expense);
    }

    // ── Trip Balance Summary ──────────────────────────────────────────────────

    public ExpenseDTOs.TripBalanceSummary getTripBalanceSummary(Long tripId, String email) {
        UserTrip trip = findTrip(tripId);
        assertMember(trip, email);

        List<User> members = getAllMembers(trip);
        BigDecimal totalExpenses = expenseRepository.sumTotalByTrip(tripId);

        // Build net balance map: userId -> net (paid - owed)
        Map<Long, BigDecimal> netBalances = new HashMap<>();
        Map<Long, BigDecimal> totalPaidMap = new HashMap<>();
        Map<Long, BigDecimal> totalOwedMap = new HashMap<>();
        Map<Long, String>     userNames    = new HashMap<>();

        for (User member : members) {
            BigDecimal paid  = expenseRepository.sumPaidByUserInTrip(tripId, member.getId());
            BigDecimal owed  = splitRepository.sumOwedByUserInTrip(tripId, member.getId());
            BigDecimal net   = paid.subtract(owed);

            netBalances.put(member.getId(), net);
            totalPaidMap.put(member.getId(), paid);
            totalOwedMap.put(member.getId(), owed);
            userNames.put(member.getId(), member.getName());
        }

        // Build per-user balance responses
        List<ExpenseDTOs.UserBalance> balances = members.stream()
                .map(m -> ExpenseDTOs.UserBalance.builder()
                        .userId(m.getId())
                        .userName(m.getName())
                        .netBalance(netBalances.get(m.getId()))
                        .totalPaid(totalPaidMap.get(m.getId()))
                        .totalOwed(totalOwedMap.get(m.getId()))
                        .build())
                .collect(Collectors.toList());

        // Run debt simplification algorithm
        List<ExpenseDTOs.SimplifiedTransaction> simplified =
                debtEngine.simplify(netBalances, userNames);

        return ExpenseDTOs.TripBalanceSummary.builder()
                .tripId(tripId)
                .tripTitle(trip.getTitle())
                .totalExpenses(totalExpenses)
                .balances(balances)
                .simplifiedTransactions(simplified)
                .build();
    }

    // ── Split Builders ────────────────────────────────────────────────────────

    private List<ExpenseSplit> buildSplits(Expense expense,
                                           ExpenseDTOs.AddExpenseRequest request,
                                           List<User> participants) {
        return switch (request.getSplitType()) {
            case EQUAL      -> buildEqualSplits(expense, request.getAmount(), participants);
            case CUSTOM     -> buildCustomSplits(expense, request, participants);
            case PERCENTAGE -> buildPercentageSplits(expense, request, participants);
        };
    }

    /**
     * EQUAL SPLIT: divide amount equally among all participants.
     * Remainder (due to rounding) is added to the first participant.
     */
    private List<ExpenseSplit> buildEqualSplits(Expense expense, BigDecimal total,
                                                List<User> participants) {
        int n = participants.size();
        BigDecimal share = total.divide(BigDecimal.valueOf(n), 2, RoundingMode.FLOOR);
        BigDecimal remainder = total.subtract(share.multiply(BigDecimal.valueOf(n)));

        List<ExpenseSplit> splits = new ArrayList<>();
        for (int i = 0; i < participants.size(); i++) {
            BigDecimal amount = (i == 0) ? share.add(remainder) : share;
            splits.add(ExpenseSplit.builder()
                    .expense(expense)
                    .user(participants.get(i))
                    .amountOwed(amount)
                    .settled(false)
                    .build());
        }
        return splits;
    }

    /**
     * CUSTOM SPLIT: each participant has a manually specified amount.
     */
    private List<ExpenseSplit> buildCustomSplits(Expense expense,
                                                 ExpenseDTOs.AddExpenseRequest request,
                                                 List<User> participants) {
        if (request.getCustomSplits() == null || request.getCustomSplits().isEmpty()) {
            throw new IllegalArgumentException("Custom splits map is required for CUSTOM split type");
        }

        return participants.stream()
                .map(user -> {
                    BigDecimal amount = request.getCustomSplits().get(user.getId());
                    if (amount == null) {
                        throw new IllegalArgumentException(
                                "Missing custom split amount for user: " + user.getId());
                    }
                    return ExpenseSplit.builder()
                            .expense(expense)
                            .user(user)
                            .amountOwed(amount)
                            .settled(false)
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * PERCENTAGE SPLIT: each participant has a percentage.
     * Percentages must sum to 100.
     */
    private List<ExpenseSplit> buildPercentageSplits(Expense expense,
                                                     ExpenseDTOs.AddExpenseRequest request,
                                                     List<User> participants) {
        if (request.getPercentageSplits() == null || request.getPercentageSplits().isEmpty()) {
            throw new IllegalArgumentException("Percentage splits map is required for PERCENTAGE split type");
        }

        double totalPct = request.getPercentageSplits().values().stream()
                .mapToDouble(Double::doubleValue).sum();
        if (Math.abs(totalPct - 100.0) > 0.01) {
            throw new IllegalArgumentException(
                    "Percentage splits must sum to 100. Got: " + totalPct);
        }

        return participants.stream()
                .map(user -> {
                    Double pct = request.getPercentageSplits().get(user.getId());
                    if (pct == null) {
                        throw new IllegalArgumentException(
                                "Missing percentage for user: " + user.getId());
                    }
                    BigDecimal amount = expense.getAmount()
                            .multiply(BigDecimal.valueOf(pct / 100))
                            .setScale(2, RoundingMode.HALF_UP);
                    return ExpenseSplit.builder()
                            .expense(expense)
                            .user(user)
                            .amountOwed(amount)
                            .percentage(pct)
                            .settled(false)
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ── Validation ────────────────────────────────────────────────────────────

    private void validateSplitTotal(List<ExpenseSplit> splits, BigDecimal totalAmount,
                                    SplitType splitType) {
        if (splitType == SplitType.EQUAL) return; // handled with remainder logic

        BigDecimal splitSum = splits.stream()
                .map(ExpenseSplit::getAmountOwed)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (splitSum.compareTo(totalAmount) != 0) {
            throw new IllegalArgumentException(
                    String.format("Split total (%s) does not match expense amount (%s)",
                            splitSum, totalAmount));
        }
    }

    // ── Response Mappers ──────────────────────────────────────────────────────

    public ExpenseDTOs.ExpenseResponse toExpenseResponse(Expense e) {
        List<ExpenseDTOs.SplitResponse> splits = e.getSplits().stream()
                .map(s -> ExpenseDTOs.SplitResponse.builder()
                        .userId(s.getUser().getId())
                        .userName(s.getUser().getName())
                        .amountOwed(s.getAmountOwed())
                        .percentage(s.getPercentage())
                        .settled(s.isSettled())
                        .build())
                .collect(Collectors.toList());

        return ExpenseDTOs.ExpenseResponse.builder()
                .id(e.getId())
                .description(e.getDescription())
                .amount(e.getAmount())
                .category(e.getCategory().name())
                .splitType(e.getSplitType().name())
                .paidBy(e.getPaidBy().getName())
                .paidByUserId(e.getPaidBy().getId())
                .tripId(e.getTrip().getId())
                .splits(splits)
                .createdAt(e.getCreatedAt().toString())
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UserTrip findTrip(Long tripId) {
        return tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found: " + tripId));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private void assertMember(UserTrip trip, String email) {
        boolean isMember = trip.getCreatedBy().getEmail().equals(email)
                || trip.getMembers().stream().anyMatch(m -> m.getEmail().equals(email));
        if (!isMember) {
            throw new UnauthorizedException("You are not a member of this trip");
        }
    }

    private List<User> getAllMembers(UserTrip trip) {
        Set<User> allMembers = new HashSet<>(trip.getMembers());
        allMembers.add(trip.getCreatedBy());
        return new ArrayList<>(allMembers);
    }
}