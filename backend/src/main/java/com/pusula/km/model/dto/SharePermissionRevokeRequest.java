package com.pusula.km.model.dto;

import com.pusula.km.model.enums.GranteeType;
import com.pusula.km.model.enums.Permission;
import com.pusula.km.model.enums.ResourceType;

public record SharePermissionRevokeRequest(
        GranteeType granteeType,
        String granteeId,
        ResourceType resourceType,
        String resourceId,
        Permission permission
) {}
