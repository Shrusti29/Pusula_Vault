package com.pusula.km.model.dto;

import java.util.UUID;

public record AddTeamMemberRequest(
        UUID userId,
        String role
) {}
