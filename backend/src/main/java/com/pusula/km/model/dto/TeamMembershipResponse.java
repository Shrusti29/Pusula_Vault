package com.pusula.km.model.dto;

import java.time.Instant;
import java.util.UUID;

public record TeamMembershipResponse(
        UUID teamId,
        UUID userId,
        String userFullName,
        String role,
        Instant joinedAt
) {}
