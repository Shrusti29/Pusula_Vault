package com.pusula.km.model.dto;

import com.pusula.km.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public record UpdateUserRequest(
        @Size(min = 2, max = 120)
        String fullName,
        @Email
        String email,
        Role role,
        @Size(min = 8, max = 128)
        String password,
        Set<String> featurePermissions,
        List<UUID> workspaceIds,
        Boolean active
) {}
