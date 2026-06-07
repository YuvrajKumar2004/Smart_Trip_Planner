package com.yuvraj.controller;

import com.yuvraj.dto.ApiResponse;
import com.yuvraj.dto.expense.ExpenseDTOs;
import com.yuvraj.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    // POST /api/expenses/trip/{tripId}
    @PostMapping("/trip/{tripId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ExpenseDTOs.ExpenseResponse>> addExpense(
            @PathVariable Long tripId,
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody ExpenseDTOs.AddExpenseRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Expense added",
                        expenseService.addExpense(tripId, user.getUsername(), request)));
    }

    // GET /api/expenses/trip/{tripId}
    @GetMapping("/trip/{tripId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ExpenseDTOs.ExpenseResponse>>> getTripExpenses(
            @PathVariable Long tripId,
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(ApiResponse.success("Expenses fetched",
                expenseService.getTripExpenses(tripId, user.getUsername())));
    }

    // DELETE /api/expenses/{expenseId}
    @DeleteMapping("/{expenseId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(
            @PathVariable Long expenseId,
            @AuthenticationPrincipal UserDetails user) {

        expenseService.deleteExpense(expenseId, user.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Expense deleted", null));
    }

    // GET /api/expenses/trip/{tripId}/balance
    @GetMapping("/trip/{tripId}/balance")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ExpenseDTOs.TripBalanceSummary>> getTripBalance(
            @PathVariable Long tripId,
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(ApiResponse.success("Balance summary",
                expenseService.getTripBalanceSummary(tripId, user.getUsername())));
    }
}