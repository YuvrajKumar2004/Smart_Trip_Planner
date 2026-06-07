package com.yuvraj.service;

import com.yuvraj.dto.analytics.AnalyticsDTOs;
import com.yuvraj.entity.AuthProvider;
import com.yuvraj.entity.Role;
import com.yuvraj.entity.User;
import com.yuvraj.exception.EmailAlreadyExistsException;
import com.yuvraj.exception.ResourceNotFoundException;
import com.yuvraj.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Create Admin / Super Admin ────────────────────────────────────────────

    @Transactional
    public AnalyticsDTOs.AdminUserView createAdmin(AnalyticsDTOs.CreateAdminRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(
                    "Email already registered: " + request.getEmail());
        }

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + request.getRole()
                    + ". Must be ADMIN or SUPER_ADMIN");
        }

        if (role == Role.USER) {
            throw new IllegalArgumentException(
                    "Cannot create a user with this endpoint. Use /auth/register.");
        }

        User admin = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .provider(AuthProvider.LOCAL)
                .build();

        admin = userRepository.save(admin);

        return AnalyticsDTOs.AdminUserView.builder()
                .id(admin.getId())
                .name(admin.getName())
                .email(admin.getEmail())
                .role(admin.getRole().name())
                .provider("LOCAL")
                .totalBookings(0)
                .totalSpend(java.math.BigDecimal.ZERO)
                .joinedAt(admin.getCreatedAt().toLocalDate().toString())
                .build();
    }

    // ── Get single user ───────────────────────────────────────────────────────

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    // ── Delete user (super admin only) ────────────────────────────────────────

    @Transactional
    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }
}