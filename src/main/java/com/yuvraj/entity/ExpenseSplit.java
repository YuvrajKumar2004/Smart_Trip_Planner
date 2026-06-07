package com.yuvraj.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "expense_splits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // The amount this user owes for this expense
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amountOwed;

    // Percentage (only populated when splitType = PERCENTAGE)
    private Double percentage;

    // Whether this split has been settled
    @Column(nullable = false)
    @Builder.Default
    private boolean settled = false;
}