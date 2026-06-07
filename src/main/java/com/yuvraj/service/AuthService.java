package com.yuvraj.service;

import com.yuvraj.dto.auth.AuthDTOs;
import com.yuvraj.entity.AuthProvider;
import com.yuvraj.entity.RefreshToken;
import com.yuvraj.entity.Role;
import com.yuvraj.entity.User;
import com.yuvraj.exception.EmailAlreadyExistsException;
import com.yuvraj.exception.UserNotFoundException;
import com.yuvraj.repository.UserRepository;
import com.yuvraj.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository       userRepository;
    private final PasswordEncoder      passwordEncoder;
    private final JwtTokenProvider     jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService  refreshTokenService;

    // ── Register ──────────────────────────────────────────────────────────────

    @Transactional
    public AuthDTOs.TokenResponse register(AuthDTOs.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .provider(AuthProvider.LOCAL)
                .build();

        userRepository.save(user);
        return buildTokenResponse(user);
    }

    // ── Login ─────────────────────────────────────────────────────────────────
       @Transactional
    public AuthDTOs.TokenResponse login(AuthDTOs.LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = (User) authentication.getPrincipal();
        return buildTokenResponse(user);
    }

    // ── Refresh token ─────────────────────────────────────────────────────────
     @Transactional
    public AuthDTOs.TokenResponse refresh(AuthDTOs.RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenService.findByToken(request.getRefreshToken());
        refreshTokenService.verifyExpiration(refreshToken);

        User user = refreshToken.getUser();
        String newAccessToken = jwtTokenProvider.generateAccessToken(user);

        return AuthDTOs.TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    @Transactional
    public void logout(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        refreshTokenService.deleteByUser(user);
    }

    // ── Change password ───────────────────────────────────────────────────────

    @Transactional
    public void changePassword(String email, AuthDTOs.ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ── Get / update profile ──────────────────────────────────────────────────

    public AuthDTOs.UserProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        return toProfileResponse(user);
    }

    @Transactional
    public AuthDTOs.UserProfileResponse updateProfile(String email, AuthDTOs.UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        user.setName(request.getName());
        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl());
        }
        userRepository.save(user);
        return toProfileResponse(user);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AuthDTOs.TokenResponse buildTokenResponse(User user) {
        String accessToken  = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = refreshTokenService.createRefreshToken(user).getToken();

        return AuthDTOs.TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    private AuthDTOs.UserProfileResponse toProfileResponse(User user) {
        return AuthDTOs.UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .provider(user.getProvider() != null ? user.getProvider().name() : "LOCAL")
                .profileImageUrl(user.getProfileImageUrl())
                .createdAt(user.getCreatedAt().toString())
                .build();
    }
}