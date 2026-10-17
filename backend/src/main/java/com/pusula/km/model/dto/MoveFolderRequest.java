package com.pusula.km.model.dto;

import java.util.UUID;

public record MoveFolderRequest(
        UUID folderId,
        UUID targetFolderId,
        UUID targetWorkspaceId
) {}
