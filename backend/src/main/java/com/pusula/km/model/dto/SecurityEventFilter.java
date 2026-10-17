package com.pusula.km.model.dto;

import com.pusula.km.model.enums.SecurityEventType;

import java.time.Instant;
import java.util.UUID;

public record SecurityEventFilter(
        SecurityEventType[] type,
        String[] severity,
        UUID actorId,
        Instant from,
        Instant to,
        Boolean resolved,
        Integer page,
        Integer size
) {}
