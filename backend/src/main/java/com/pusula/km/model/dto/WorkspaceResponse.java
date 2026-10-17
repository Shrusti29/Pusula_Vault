package com.pusula.km.model.dto;

import com.pusula.km.model.enums.Permission;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WorkspaceResponse(
        UUID id,
        String name,
        String description,
        Instant createdAt,
        Instant updatedAt,
        UUID createdBy,
        Integer documentCount,
        Long storageUsedBytes,
        List<Permission> effectivePermissions
) {}
