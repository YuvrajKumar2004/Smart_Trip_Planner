package com.yuvraj.service;

import com.yuvraj.dto.expense.ExpenseDTOs;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Debt Simplification Algorithm
 * ─────────────────────────────
 * Given a list of raw "A owes B X amount" debts among N people,
 * this reduces them to the MINIMUM number of transactions needed
 * to settle all balances.
 *
 * Algorithm (Greedy Net Balance Matching):
 * 1. Compute each person's NET balance = total_paid - total_owed
 * 2. Separate into creditors (net > 0) and debtors (net < 0)
 * 3. Greedily match the largest debtor with the largest creditor
 * 4. Repeat until all balances are zero
 *
 * Time complexity: O(N log N) due to sorting
 * Optimal for small groups (N <= 20), typical for trip groups
 *
 * Example:
 *   A paid 300, B paid 0, C paid 0  (total 300, 3 people, each owes 100)
 *   Net: A = +200, B = -100, C = -100
 *   Simplified: B pays A 100, C pays A 100  (2 transactions, minimum)
 *
 *   Without simplification you might have:
 *   B pays A 100, C pays B 50, C pays A 50  (3 transactions)
 */
@Component
public class DebtSimplificationEngine {

    /**
     * @param netBalances Map of userId -> net balance
     *                    Positive = user is owed money
     *                    Negative = user owes money
     * @param userNames   Map of userId -> userName (for response labels)
     * @return Minimum list of SimplifiedTransaction to settle all debts
     */
    public List<ExpenseDTOs.SimplifiedTransaction> simplify(
            Map<Long, BigDecimal> netBalances,
            Map<Long, String> userNames) {

        // Separate into creditors (owed money) and debtors (owe money)
        // Use PriorityQueues: max-heap for creditors, min-heap for debtors
        PriorityQueue<long[]> creditors = new PriorityQueue<>(
                (a, b) -> b[1] > a[1] ? 1 : -1);  // max by amount (stored as cents)
        PriorityQueue<long[]> debtors = new PriorityQueue<>(
                (a, b) -> a[1] < b[1] ? 1 : -1);   // min by amount (most negative first)

        for (Map.Entry<Long, BigDecimal> entry : netBalances.entrySet()) {
            long userId  = entry.getKey();
            long cents   = entry.getValue()
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(0, RoundingMode.HALF_UP)
                    .longValue();

            if (cents > 0) {
                creditors.offer(new long[]{userId, cents});
            } else if (cents < 0) {
                debtors.offer(new long[]{userId, cents});
            }
            // cents == 0: already balanced, skip
        }

        List<ExpenseDTOs.SimplifiedTransaction> transactions = new ArrayList<>();

        while (!creditors.isEmpty() && !debtors.isEmpty()) {
            long[] creditor = creditors.poll();   // {userId, +amount}
            long[] debtor   = debtors.poll();     // {userId, -amount}

            long creditAmt = creditor[1];
            long debitAmt  = Math.abs(debtor[1]);
            long settled   = Math.min(creditAmt, debitAmt);

            BigDecimal settledAmount = BigDecimal.valueOf(settled)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            transactions.add(ExpenseDTOs.SimplifiedTransaction.builder()
                    .fromUserId(debtor[0])
                    .fromUserName(userNames.getOrDefault(debtor[0], "User " + debtor[0]))
                    .toUserId(creditor[0])
                    .toUserName(userNames.getOrDefault(creditor[0], "User " + creditor[0]))
                    .amount(settledAmount)
                    .build());

            // Requeue if there's a remaining balance
            if (creditAmt > debitAmt) {
                creditors.offer(new long[]{creditor[0], creditAmt - debitAmt});
            } else if (debitAmt > creditAmt) {
                debtors.offer(new long[]{debtor[0], -(debitAmt - creditAmt)});
            }
            // If equal, both are fully settled — don't requeue
        }

        return transactions;
    }
}