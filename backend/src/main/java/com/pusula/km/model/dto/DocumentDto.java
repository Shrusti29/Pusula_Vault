package com.pusula.km.model.dto;

import com.pusula.km.model.enums.DocumentStatus;
import java.time.Instant;
import java.util.UUID;

public record DocumentDto(
        UUID id,
        UUID workspaceId,
        UUID folderId,
        String title,
        String content,
        String contentType,
        UUID createdById,
        UUID updatedById,
        Instant createdAt,
        Instant updatedAt,
        Integer currentVersion,
        DocumentStatus status,
        Long version
) {}
