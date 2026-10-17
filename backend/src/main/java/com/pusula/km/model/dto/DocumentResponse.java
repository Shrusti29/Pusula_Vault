package com.pusula.km.model.dto;

import com.pusula.km.model.enums.DocumentStatus;
import com.pusula.km.model.enums.DocumentType;
import com.pusula.km.model.enums.Permission;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DocumentResponse(
        UUID id,
        UUID workspaceId,
        UUID folderId,
        String title,
        String content,
        String contentType,
        DocumentStatus status,
        Integer currentVersion,
        List<TagResponse> tags,
        UUID createdBy,
        UUID updatedBy,
        Instant createdAt,
        Instant updatedAt,
        Instant lastEditedAt,
        List<Permission> effectivePermissions,
        Boolean copyAllowed,
        Long version,
        DocumentType documentType
) {}
