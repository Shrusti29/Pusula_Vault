package com.pusula.km.model.dto;

public record ActivityPeriodBucket(
        String date,
        int created,
        int edited,
        int viewed,
        int uploaded,
        int downloaded,
        int aiInteractions
) {}
