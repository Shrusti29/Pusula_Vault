package com.pusula.km.model.response;

import com.pusula.km.model.dto.UserResponse;
import com.pusula.km.model.enums.Role;

import java.util.List;
import java.util.UUID;

public record LoginResponse(
        String token,
        UserResponse user,
        List<UUID> visibleWorkspaceIds,
        Role role,
        String deviceStatus,
        String deviceMessage
) {}
