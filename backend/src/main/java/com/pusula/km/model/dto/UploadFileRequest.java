package com.pusula.km.model.dto;

import java.util.UUID;

public record UploadFileRequest(
        UUID documentId,
        UUID folderId
) {}
