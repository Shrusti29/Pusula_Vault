package com.pusula.km.model.dto;

import java.time.Instant;
import java.util.UUID;

public record TeamResponse(
        UUID id,
        String name,
        String description,
        UUID workspaceId,
        Integer memberCount,
        Instant createdAt
) {}
