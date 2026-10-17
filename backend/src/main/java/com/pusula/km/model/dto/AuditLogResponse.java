package com.pusula.km.model.dto;

import com.pusula.km.model.enums.AuditAction;
import com.pusula.km.model.enums.ResourceType;
import com.pusula.km.model.enums.Role;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditLogResponse(
        Long id,
        AuditAction action,
        UUID actorId,
        String actorUsername,
        Role actorRole,
        String sessionId,
        ResourceType resourceType,
        String resourceId,
        String resourceName,
        UUID workspaceId,
        String ipAddress,
        String userAgent,
        boolean success,
        String message,
        Map<String, Object> previousState,
        Map<String, Object> newState,
        Instant createdAt
) {}
