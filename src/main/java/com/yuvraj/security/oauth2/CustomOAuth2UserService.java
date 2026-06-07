package com.yuvraj.security.oauth2;



import com.yuvraj.entity.User;
import com.yuvraj.entity.AuthProvider;
import com.yuvraj.entity.Role;
import com.yuvraj.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        AuthProvider provider = AuthProvider.valueOf(registrationId.toUpperCase());
        OAuth2UserInfo userInfo = OAuth2UserInfo.of(provider, oAuth2User.getAttributes());

        if (!StringUtils.hasText(userInfo.getEmail())) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }

        User user = userRepository.findByEmail(userInfo.getEmail())
                .map(existing -> updateExistingUser(existing, userInfo))
                .orElseGet(() -> registerNewOAuth2User(userInfo));

        return new CustomOAuth2User(user, oAuth2User.getAttributes());
    }

    private User registerNewOAuth2User(OAuth2UserInfo userInfo) {
        User user = User.builder()
                .name(userInfo.getName())
                .email(userInfo.getEmail())
                .profileImageUrl(userInfo.getImageUrl())
                .provider(userInfo.getProvider())
                .providerId(userInfo.getId())
                .role(Role.USER)
                .build();
        return userRepository.save(user);
    }

    private User updateExistingUser(User existing, OAuth2UserInfo userInfo) {
        existing.setName(userInfo.getName());
        existing.setProfileImageUrl(userInfo.getImageUrl());
        return userRepository.save(existing);
    }
}