package com.pusula.km.model.dto;

import com.pusula.km.model.enums.ResourceType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SearchResultItem(
        ResourceType type,
        String id,
        UUID workspaceId,
        String title,
        String snippet,
        String author,
        Instant lastModified,
        Integer version,
        String workspaceName,
        List<String> tags,
        Double score
) {}
