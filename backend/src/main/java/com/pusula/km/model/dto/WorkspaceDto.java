package com.pusula.km.model.dto;

import java.time.Instant;
import java.util.UUID;

public record WorkspaceDto(
        UUID id,
        String name,
        String description,
        UUID createdById,
        Instant createdAt,
        Instant updatedAt
) {}
