package com.pusula.km.model.dto;

import com.pusula.km.model.enums.ResourceType;
import com.pusula.km.model.enums.SecurityEventType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record SecurityEventResponse(
        Long id,
        SecurityEventType type,
        String severity,
        UUID actorId,
        UUID workspaceId,
        ResourceType resourceType,
        String resourceId,
        String description,
        Map<String, Object> metadata,
        Instant detectedAt,
        Instant resolvedAt
) {}
