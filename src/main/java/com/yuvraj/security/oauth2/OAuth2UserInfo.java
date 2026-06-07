package com.yuvraj.security.oauth2;

import com.yuvraj.entity.AuthProvider;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Map;

/**
 * Extracts standardized user info from OAuth2 provider attributes.
 * Supports Google (and can be extended to GitHub, Facebook, etc.)
 */
@Getter
@Builder
public class OAuth2UserInfo {

    private String id;
    private String name;
    private String email;
    private String imageUrl;
    private AuthProvider provider;

    public static OAuth2UserInfo of(AuthProvider provider, Map<String, Object> attributes) {
        return switch (provider) {
            case GOOGLE -> fromGoogle(attributes);
            case GITHUB -> fromGitHub(attributes);
            default     -> throw new IllegalArgumentException("Unsupported provider: " + provider);
        };
    }

    private static OAuth2UserInfo fromGoogle(Map<String, Object> attr) {
        return OAuth2UserInfo.builder()
                .id((String) attr.get("sub"))
                .name((String) attr.get("name"))
                .email((String) attr.get("email"))
                .imageUrl((String) attr.get("picture"))
                .provider(AuthProvider.GOOGLE)
                .build();
    }

    private static OAuth2UserInfo fromGitHub(Map<String, Object> attr) {
        return OAuth2UserInfo.builder()
                .id(String.valueOf(attr.get("id")))
                .name((String) attr.get("name"))
                .email((String) attr.get("email"))
                .imageUrl((String) attr.get("avatar_url"))
                .provider(AuthProvider.GITHUB)
                .build();
    }
}
