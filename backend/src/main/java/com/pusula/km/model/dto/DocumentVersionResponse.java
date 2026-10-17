package com.pusula.km.model.dto;

import java.time.Instant;
import java.util.UUID;

public record DocumentVersionResponse(
        Long id,
        UUID documentId,
        Integer versionNumber,
        String content,
        String changeSummary,
        Long sizeBytes,
        UUID createdBy,
        Instant createdAt,
        Boolean priority,
        String priorityNote
) {}
