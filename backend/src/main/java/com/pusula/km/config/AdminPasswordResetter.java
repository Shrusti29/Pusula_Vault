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

    // BCrypt hash for the literal password "admin123"
    private static final String ADMIN_PASSWORD_HASH = "$2a$10$7QhYvH1W6Ol2GkKvD3cZPuVO5iijLzGAnYqL1fUO1116p7vKz2ZxK"; // generated once

    @Bean
    public CommandLineRunner resetAdminPassword(UserRepository userRepository) {
        return args -> {
            String adminEmail = System.getenv().getOrDefault("PV_INITIAL_ADMIN_EMAIL", "admin@gmail.com");
            userRepository.findByEmailIgnoreCase(adminEmail).ifPresent(admin -> {
                admin.setPasswordHash(ADMIN_PASSWORD_HASH);
                userRepository.save(admin);
                System.out.println("✅ Admin password forced to known hash (admin123)");
            });
        };
    }
}
