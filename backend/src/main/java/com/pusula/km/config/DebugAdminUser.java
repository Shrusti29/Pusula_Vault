package com.pusula.km.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import com.pusula.km.model.entity.User;
import com.pusula.km.repository.UserRepository;

/**
 * Debug helper – prints the admin user’s email and password hash at startup.
 * Remove this file after verification.
 */
@Configuration
@Order(2) // Runs after DataSeeder (order 0) and AdminPasswordResetter (order 1)
public class DebugAdminUser implements CommandLineRunner {

    private final UserRepository userRepository;

    public DebugAdminUser(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        userRepository.findByEmailIgnoreCase("admin@gmail.com")
                .ifPresentOrElse(
                        admin -> {
                            System.out.println("🔎 DEBUG: Admin user -> email: " + admin.getEmail()
                                    + " | passwordHash: " + admin.getPasswordHash());
                        },
                        () -> System.out.println("🔎 DEBUG: Admin user not found"));
    }
}
