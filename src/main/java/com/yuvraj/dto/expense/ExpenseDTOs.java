package com.yuvraj.dto.expense;

import com.yuvraj.entity.ExpenseCategory;
import com.yuvraj.entity.SplitType;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ExpenseDTOs {

    // =========================================================================
    // ADD EXPENSE
    // =========================================================================

    @Data
    public static class AddExpenseRequest {

        @NotBlank(message = "Description is required")
        private String description;

        @NotNull
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        private BigDecimal amount;

        @NotNull
        private ExpenseCategory category;

        @NotNull
        private SplitType splitType;

        // IDs of users who are splitting this expense
        @NotEmpty(message = "At least one participant is required")
        private List<Long> participantIds;

        // For CUSTOM split: userId -> amount
        private Map<Long, BigDecimal> customSplits;

        // For PERCENTAGE split: userId -> percentage (must sum to 100)
        private Map<Long, Double> percentageSplits;
    }

    // =========================================================================
    // EXPENSE RESPONSE
    // =========================================================================

    @Data
    @Builder
    public static class ExpenseResponse {
        private Long id;
        private String description;
        private BigDecimal amount;
        private String category;
        private String splitType;
        private String paidBy;
        private Long paidByUserId;
        private Long tripId;
        private List<SplitResponse> splits;
        private String createdAt;
    }

    @Data
    @Builder
    public static class SplitResponse {
        private Long userId;
        private String userName;
        private BigDecimal amountOwed;
        private Double percentage;
        private boolean settled;
    }

    // =========================================================================
    // BALANCE
    // =========================================================================

    @Data
    @Builder
    public static class UserBalance {
        private Long userId;
        private String userName;
        // positive = they are owed money; negative = they owe money
        private BigDecimal netBalance;
        private BigDecimal totalPaid;
        private BigDecimal totalOwed;
    }

    @Data
    @Builder
    public static class TripBalanceSummary {
        private Long tripId;
        private String tripTitle;
        private BigDecimal totalExpenses;
        private List<UserBalance> balances;
        private List<SimplifiedTransaction> simplifiedTransactions;
    }

    // =========================================================================
    // DEBT SIMPLIFICATION
    // =========================================================================

    @Data
    @Builder
    public static class SimplifiedTransaction {
        private Long fromUserId;
        private String fromUserName;
        private Long toUserId;
        private String toUserName;
        private BigDecimal amount;
    }

    // =========================================================================
    // SETTLEMENT
    // =========================================================================

    @Data
    public static class SettleRequest {
        @NotNull
        private Long toUserId;

        @NotNull
        private Long tripId;

        @NotNull
        @DecimalMin("0.01")
        private BigDecimal amount;

        private String note;
    }

    @Data
    @Builder
    public static class SettlementResponse {
        private Long id;
        private Long fromUserId;
        private String fromUserName;
        private Long toUserId;
        private String toUserName;
        private Long tripId;
        private BigDecimal amount;
        private String status;
        private String note;
        private String createdAt;
        private String settledAt;
    }

    @Data
    @Builder
    public static class PendingSettlementResponse {
        private Long tripId;
        private String tripTitle;
        private List<SimplifiedTransaction> youOwe;
        private List<SimplifiedTransaction> owedToYou;
    }
}