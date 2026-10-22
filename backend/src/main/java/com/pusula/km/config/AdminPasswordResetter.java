package com.pusula.km.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.pusula.km.model.entity.User;
import com.pusula.km.repository.UserRepository;

/**
 * Resets the seeded admin password to a known value (admin123).
 * Runs after DataSeeder (order 1) and ensures the password hash matches the plain‑text password.
 */
@Configuration
@Order(1)
public class AdminPasswordResetter {

    @Bean
    public CommandLineRunner resetAdminPassword(UserRepository userRepository) {
        return args -> {
            String adminEmail = System.getenv().getOrDefault("PV_INITIAL_ADMIN_EMAIL", "admin@gmail.com");
            userRepository.findByEmail(adminEmail).ifPresent(admin -> {
                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
                String hashed = encoder.encode("admin123");
                admin.setPasswordHash(hashed);
                userRepository.save(admin);
                System.out.println("✅ Admin password reset to 'admin123'");
            });
        };
    }
}
