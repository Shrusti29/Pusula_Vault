package com.pusula.km.model.dto;

import java.util.UUID;

public record CreateTeamRequest(
        String name,
        String description,
        UUID workspaceId
) {}
