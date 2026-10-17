package com.pusula.km.model.dto;

import com.pusula.km.model.enums.GranteeType;
import com.pusula.km.model.enums.Permission;

import java.time.Instant;
import java.util.List;

public record TopGrantItem(
        String id,
        GranteeType granteeType,
        String granteeLabel,
        String resourceLabel,
        List<Permission> permissions,
        Instant grantedAt,
        String grantedBy
) {}
