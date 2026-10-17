package com.pusula.km.model.dto;

import java.util.UUID;

public record CreateFolderRequest(
        UUID workspaceId,
        UUID parentFolderId,
        String name
) {}
