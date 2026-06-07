package com.yuvraj.dto.auth;



import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

// ── Register Request ──────────────────────────────────────────────────────────
public class AuthDTOs {

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        private String name;

        @Email(message = "Invalid email format")
        @NotBlank(message = "Email is required")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        @Pattern(
                regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$",
                message = "Password must contain uppercase, lowercase, digit and special character"
        )
        private String password;
    }

    // ── Login Request ─────────────────────────────────────────────────────────
    @Data
    public static class LoginRequest {
        @Email
        @NotBlank
        private String email;

        @NotBlank
        private String password;
    }

    // ── Token Response ────────────────────────────────────────────────────────
    @Data
    @lombok.Builder
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class TokenResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private Long userId;
        private String name;
        private String email;
        private String role;
    }

    // ── Refresh Token Request ─────────────────────────────────────────────────
    @Data
    public static class RefreshTokenRequest {
        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }

    // ── Change Password Request ───────────────────────────────────────────────
    @Data
    public static class ChangePasswordRequest {
        @NotBlank
        private String currentPassword;

        @NotBlank
        @Size(min = 8)
        @Pattern(
                regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$",
                message = "Password must contain uppercase, lowercase, digit and special character"
        )
        private String newPassword;
    }

    // ── Update Profile Request ────────────────────────────────────────────────
    @Data
    public static class UpdateProfileRequest {
        @NotBlank
        private String name;

        private String profileImageUrl;
    }

    // ── User Profile Response ─────────────────────────────────────────────────
    @Data
    @lombok.Builder
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class UserProfileResponse {
        private Long id;
        private String name;
        private String email;
        private String role;
        private String provider;
        private String profileImageUrl;
        private String createdAt;
    }
}