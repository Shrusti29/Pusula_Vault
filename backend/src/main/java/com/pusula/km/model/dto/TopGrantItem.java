package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pusula.km.model.enums.GranteeType;
import com.pusula.km.model.enums.Permission;

import java.time.Instant;
import java.util.List;

public record TopGrantItem(
        @JsonProperty("id") String id,
        @JsonProperty("granteeType") GranteeType granteeType,
        @JsonProperty("granteeLabel") String granteeLabel,
        @JsonProperty("resourceLabel") String resourceLabel,
        @JsonProperty("permissions") List<Permission> permissions,
        @JsonProperty("grantedAt") Instant grantedAt,
        @JsonProperty("grantedBy") String grantedBy
) {
    @JsonProperty("grantee_type")
    public GranteeType granteeTypeSnake() { return granteeType; }

    @JsonProperty("grantee_label")
    public String granteeLabelSnake() { return granteeLabel; }

    @JsonProperty("resource_label")
    public String resourceLabelSnake() { return resourceLabel; }

    @JsonProperty("granted_at")
    public Instant grantedAtSnake() { return grantedAt; }

    @JsonProperty("granted_by")
    public String grantedBySnake() { return grantedBy; }
}
