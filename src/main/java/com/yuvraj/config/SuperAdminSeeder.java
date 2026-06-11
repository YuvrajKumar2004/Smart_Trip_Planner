package com.yuvraj.config;

import com.yuvraj.entity.AuthProvider;
import com.yuvraj.entity.Role;
import com.yuvraj.entity.User;
import com.yuvraj.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SuperAdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        String email = "super@gmail.com";

        if (userRepository.findByEmail(email).isEmpty()) {

            User superAdmin = User.builder()
                    .name("Super Admin")
                    .email(email)
                    .password(passwordEncoder.encode("Super@1"))
                    .role(Role.SUPER_ADMIN)
                    .provider(AuthProvider.LOCAL)
                    .build();

            userRepository.save(superAdmin);

            System.out.println("SUPER ADMIN CREATED");
        }
    }
}
