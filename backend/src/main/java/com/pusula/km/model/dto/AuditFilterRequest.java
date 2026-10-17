package com.pusula.km.model.dto;

import com.pusula.km.model.enums.AuditAction;
import com.pusula.km.model.enums.ResourceType;

import java.time.Instant;
import java.util.UUID;

public record AuditFilterRequest(
        UUID actorId,
        AuditAction[] action,
        ResourceType resourceType,
        String resourceId,
        UUID workspaceId,
        Instant from,
        Instant to,
        Boolean success,
        Integer page,
        Integer size
) {}
