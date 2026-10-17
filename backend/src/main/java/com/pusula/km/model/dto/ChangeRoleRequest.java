package com.pusula.km.model.dto;

import com.pusula.km.model.enums.Role;

import java.util.UUID;

public record ChangeRoleRequest(
        UUID userId,
        Role newRole
) {}
