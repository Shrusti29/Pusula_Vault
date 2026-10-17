package com.pusula.km.model.dto;

import com.pusula.km.model.enums.DocumentStatus;

import java.util.List;
import java.util.UUID;

public record UpdateDocumentRequest(
        String title,
        String content,
        DocumentStatus status,
        List<UUID> tags,
        String changeSummary
) {}
