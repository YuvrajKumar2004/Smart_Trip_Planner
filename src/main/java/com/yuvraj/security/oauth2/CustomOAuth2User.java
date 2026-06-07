package com.yuvraj.security.oauth2;

import com.yuvraj.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;

/**
 * Wraps the authenticated User entity as an OAuth2User so Spring Security
 * can work with it downstream (e.g. in the success handler).
 */
public class CustomOAuth2User implements OAuth2User {

    private final User user;
    private final Map<String, Object> attributes;

    public CustomOAuth2User(User user, Map<String, Object> attributes) {
        this.user       = user;
        this.attributes = attributes;
    }

    public User getUser() { return user; }

    @Override public Map<String, Object> getAttributes() { return attributes; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return user.getAuthorities();
    }
    @Override public String getName() { return user.getEmail(); }
}