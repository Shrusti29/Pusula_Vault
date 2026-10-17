package com.pusula.km.model.dto;

import com.pusula.km.model.enums.Permission;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record FileAssetResponse(
        UUID id,
        UUID documentId,
        UUID workspaceId,
        UUID folderId,
        String originalName,
        String mimeType,
        String extension,
        Long sizeBytes,
        String checksum,
        boolean encrypted,
        String storageKey,
        String ocrText,
        String ocrStatus,
        UUID createdBy,
        Instant createdAt,
        List<Permission> effectivePermissions,
        Boolean downloadAllowed
) {}
