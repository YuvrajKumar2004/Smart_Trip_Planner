package com.yuvraj.security.oauth2;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yuvraj.dto.auth.AuthDTOs;
import com.yuvraj.security.JwtTokenProvider;
import com.yuvraj.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final ObjectMapper objectMapper;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        var user = oAuth2User.getUser();

        String accessToken  = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = refreshTokenService.createRefreshToken(user).getToken();

        String redirectUrl = "http://localhost:3000/oauth2/redirect?accessToken=" + accessToken 
                + "&refreshToken=" + refreshToken 
                + "&userId=" + user.getId() 
                + "&name=" + java.net.URLEncoder.encode(user.getName(), java.nio.charset.StandardCharsets.UTF_8)
                + "&email=" + java.net.URLEncoder.encode(user.getEmail(), java.nio.charset.StandardCharsets.UTF_8)
                + "&role=" + user.getRole().name();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}