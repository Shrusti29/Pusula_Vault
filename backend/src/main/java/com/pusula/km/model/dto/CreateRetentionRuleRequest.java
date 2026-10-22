package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public record CreateRetentionRuleRequest(
    @JsonProperty("name") @JsonAlias({"policyName", "policy_name", "ruleName", "rule_name"}) String name,
    @JsonProperty("description") @JsonAlias({"desc"}) String description,
    @JsonProperty("retentionDays") @JsonAlias({"retention_days"}) Integer retentionDays,
    @JsonProperty("autoArchive") @JsonAlias({"auto_archive"}) boolean autoArchive,
    @JsonProperty("autoDelete") @JsonAlias({"auto_delete"}) boolean autoDelete,
    @JsonProperty("applicableDocumentTypes") @JsonAlias({"applicable_document_types", "documentTypes", "classification"}) String applicableDocumentTypes
) {}
