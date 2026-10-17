package com.pusula.km.model.dto;

public record CreateRetentionRuleRequest(
    String name,
    String description,
    Integer retentionDays,
    boolean autoArchive,
    boolean autoDelete,
    String applicableDocumentTypes
) {}
