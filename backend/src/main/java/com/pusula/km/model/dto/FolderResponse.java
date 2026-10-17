package com.pusula.km.model.dto;

import java.time.Instant;
import java.util.UUID;

public record FolderResponse(
        UUID id,
        UUID workspaceId,
        UUID parentFolderId,
        String name,
        String path,
        Instant createdAt,
        Instant updatedAt,
        Integer documentCount,
        Integer subfolderCount
) {}
