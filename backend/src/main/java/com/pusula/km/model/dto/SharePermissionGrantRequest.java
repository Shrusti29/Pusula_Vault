package com.pusula.km.model.dto;

import com.pusula.km.model.enums.GranteeType;
import com.pusula.km.model.enums.Permission;
import com.pusula.km.model.enums.ResourceType;

import java.util.UUID;

public record SharePermissionGrantRequest(
        GranteeType granteeType,
        String granteeId,
        ResourceType resourceType,
        String resourceId,
        Permission permission,
        boolean allow,
        UUID assignedBy
) {}
