package com.pusula.km.security;

import com.pusula.km.model.entity.User;
import com.pusula.km.model.enums.Role;
import com.pusula.km.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @Test
    void loadsUsersByEmailCaseInsensitively() {
        User user = User.builder()
                .email("person@example.com")
                .username("person@example.com")
                .passwordHash("$2a$10$hash")
                .displayName("Person")
                .role(Role.EMPLOYEE)
                .active(true)
                .build();
        when(userRepository.findByEmailIgnoreCase("person@example.com")).thenReturn(Optional.of(user));

        var details = new CustomUserDetailsService(userRepository).loadUserByUsername(" Person@example.com ");

        assertEquals("person@example.com", details.getUsername());
        assertEquals("$2a$10$hash", details.getPassword());
        assertTrue(details.isEnabled());
        assertTrue(details.getAuthorities().stream().anyMatch(a -> "ROLE_EMPLOYEE".equals(a.getAuthority())));
    }

    @Test
    void rejectsUnknownEmail() {
        when(userRepository.findByEmailIgnoreCase("missing@example.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> new CustomUserDetailsService(userRepository).loadUserByUsername("missing@example.com"));
    }

    @Test
    void disablesInactiveUsers() {
        User user = User.builder()
                .email("inactive@example.com")
                .username("inactive@example.com")
                .passwordHash("$2a$10$hash")
                .role(Role.EMPLOYEE)
                .active(false)
                .build();
        when(userRepository.findByEmailIgnoreCase("inactive@example.com")).thenReturn(Optional.of(user));

        var details = new CustomUserDetailsService(userRepository).loadUserByUsername("inactive@example.com");

        assertFalse(details.isEnabled());
    }
}
