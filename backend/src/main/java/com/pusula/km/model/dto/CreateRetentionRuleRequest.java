package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CreateRetentionRuleRequest(
    @JsonProperty("name") String name,
    @JsonProperty("description") String description,
    @JsonProperty("retentionDays") Integer retentionDays,
    @JsonProperty("autoArchive") boolean autoArchive,
    @JsonProperty("autoDelete") boolean autoDelete,
    @JsonProperty("applicableDocumentTypes") String applicableDocumentTypes
) {}
