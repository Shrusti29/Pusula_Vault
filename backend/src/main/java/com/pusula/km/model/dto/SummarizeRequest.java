package com.pusula.km.model.dto;

import java.util.List;
import java.util.UUID;

public record SummarizeRequest(
        UUID documentId,
        List<UUID> documentIds,
        UUID userId,
        Integer maxLength,
        String style,
        String targetLanguage
) {}
