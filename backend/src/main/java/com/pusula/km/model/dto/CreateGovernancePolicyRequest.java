package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pusula.km.model.enums.SensitivityLevel;
import java.util.UUID;

public record CreateGovernancePolicyRequest(
    @JsonProperty("name") String name,
    @JsonProperty("description") String description,
    @JsonProperty("sensitivityLevel") SensitivityLevel sensitivityLevel,
    @JsonProperty("retentionRuleId") UUID retentionRuleId,
    @JsonProperty("policyText") String policyText,
    @JsonProperty("enforceOnCreate") boolean enforceOnCreate,
    @JsonProperty("enforceOnEdit") boolean enforceOnEdit,
    @JsonProperty("requireApproval") boolean requireApproval
) {}
