package com.pusula.km.model.dto;

import com.pusula.km.model.enums.Role;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String email,
        Role role,
        String fullName,
        boolean active,
        Instant createdAt,
        Instant updatedAt,
        Set<String> featurePermissions,
        List<UUID> workspaceIds
) {}
