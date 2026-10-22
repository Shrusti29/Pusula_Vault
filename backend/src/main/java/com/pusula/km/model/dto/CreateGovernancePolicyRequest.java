package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.pusula.km.model.enums.SensitivityLevel;
import java.util.UUID;

public record CreateGovernancePolicyRequest(
    @JsonProperty("name") @JsonAlias({"title", "policy_name", "policyName"}) String name,
    @JsonProperty("description") @JsonAlias({"desc"}) String description,
    @JsonProperty("sensitivityLevel") @JsonAlias({"sensitivity_level", "classification", "policyType", "policy_type"}) SensitivityLevel sensitivityLevel,
    @JsonProperty("retentionRuleId") @JsonAlias({"retention_rule_id"}) UUID retentionRuleId,
    @JsonProperty("policyText") @JsonAlias({"policy_text", "rulesText", "rules_text"}) String policyText,
    @JsonProperty("enforceOnCreate") @JsonAlias({"enforce_on_create", "enforced"}) boolean enforceOnCreate,
    @JsonProperty("enforceOnEdit") @JsonAlias({"enforce_on_edit"}) boolean enforceOnEdit,
    @JsonProperty("requireApproval") @JsonAlias({"require_approval"}) boolean requireApproval
) {}
