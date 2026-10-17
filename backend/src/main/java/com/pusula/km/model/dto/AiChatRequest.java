package com.pusula.km.model.dto;

import java.util.List;
import java.util.UUID;

public record AiChatRequest(
        String message,
        String conversationId,
        UUID userId,
        List<UUID> documentIds,
        UUID workspaceId,
        boolean includeCitations,
        String model,
        Double temperature
) {}
