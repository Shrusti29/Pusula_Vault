package com.pusula.km.model.dto;

import com.pusula.km.model.enums.Role;
import java.time.Instant;
import java.util.UUID;

public record UserDto(
        UUID id,
        String username,
        String email,
        String displayName,
        Role role,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {}
