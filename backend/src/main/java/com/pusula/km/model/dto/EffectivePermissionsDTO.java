package com.pusula.km.model.dto;

import com.pusula.km.model.enums.Permission;
import com.pusula.km.model.enums.ResourceType;

import java.util.Map;
import java.util.Set;

public record EffectivePermissionsDTO(
        String resourceId,
        ResourceType resourceType,
        Set<Permission> allowedPermissions,
        Map<String, Set<Permission>> inheritedFrom
) {}
