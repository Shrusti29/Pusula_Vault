package com.pusula.km.model.dto;

import com.pusula.km.model.enums.Role;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public record CreateUserRequest(
        String username,
        String email,
        String fullName,
        Role role,
        String password,
        Set<String> featurePermissions,
        List<UUID> workspaceIds
) {}
