package com.pusula.km.model.dto;

import java.util.List;

public record ProgressDigest(
        List<String> observedActivity,
        String aiGeneratedSummary,
        String period,
        String startDate,
        String endDate
) {}
