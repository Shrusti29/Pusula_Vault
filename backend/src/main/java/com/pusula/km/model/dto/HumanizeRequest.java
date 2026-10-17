package com.pusula.km.model.dto;

import java.util.UUID;

public record HumanizeRequest(
        String text,
        String style,
        String targetLanguage,
        UUID userId,
        UUID documentId,
        Double temperature,
        String tone
) {}
