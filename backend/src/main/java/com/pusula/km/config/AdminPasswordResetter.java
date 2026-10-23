package com.pusula.km.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import com.pusula.km.repository.UserRepository;

/**
 * Guarantees that the admin user always has password "admin123".
 * Uses a pre‑computed BCrypt hash to avoid runtime encoding differences.
 */
@Configuration
@Order(1) // runs after DataSeeder (order 0)
public class AdminPasswordResetter {

    @Bean
    public CommandLineRunner resetAdminPassword(UserRepository userRepository, org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        return args -> {
            String adminEmail = System.getenv().getOrDefault("PV_INITIAL_ADMIN_EMAIL", "admin@gmail.com");
            userRepository.findByEmailIgnoreCase(adminEmail).ifPresent(admin -> {
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                userRepository.save(admin);
                System.out.println("✅ Admin password encoded and reset successfully to admin123");
            });
        };
    }
}
