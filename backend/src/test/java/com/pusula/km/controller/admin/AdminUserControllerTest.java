package com.pusula.km.controller.admin;

import com.pusula.km.model.dto.CreateUserRequest;
import com.pusula.km.model.enums.Role;
import com.pusula.km.repository.UserRepository;
import com.pusula.km.mapper.UserMapper;
import com.pusula.km.service.impl.AccessScopeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerTest {

    @Mock private UserRepository userRepository;
    @Mock private UserMapper userMapper;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AccessScopeService accessScopeService;

    @Test
    void rejectsDuplicateEmailBeforeSaving() {
        when(userRepository.existsByEmailIgnoreCase("person@example.com")).thenReturn(true);
        var controller = new AdminUserController(userRepository, userMapper, passwordEncoder, accessScopeService);

        assertThrows(com.pusula.km.exception.ConflictException.class, () ->
                controller.createUser(new CreateUserRequest(
                        " Person@example.com ", "Person", Role.EMPLOYEE, "long-enough-password",
                        Set.of(), null)));
    }
}
