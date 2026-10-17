package com.pusula.km.model.dto;

import com.pusula.km.model.enums.SensitivityLevel;
import java.util.UUID;

public record CreateGovernancePolicyRequest(
    String name,
    String description,
    SensitivityLevel sensitivityLevel,
    UUID retentionRuleId,
    String policyText,
    boolean enforceOnCreate,
    boolean enforceOnEdit,
    boolean requireApproval
) {}
