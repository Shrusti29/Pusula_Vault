package com.pusula.km.model.dto;

import java.util.UUID;

public record TagResponse(
        UUID id,
        String name,
        Integer usageCount
) {}
