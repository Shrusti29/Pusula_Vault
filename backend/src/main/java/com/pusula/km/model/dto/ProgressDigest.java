package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record ProgressDigest(
        @JsonProperty("observedActivity") List<String> observedActivity,
        @JsonProperty("aiGeneratedSummary") String aiGeneratedSummary,
        @JsonProperty("period") String period,
        @JsonProperty("startDate") String startDate,
        @JsonProperty("endDate") String endDate
) {
    @JsonProperty("observed_activity")
    public List<String> observedActivitySnake() { return observedActivity; }

    @JsonProperty("ai_generated_summary")
    public String aiGeneratedSummarySnake() { return aiGeneratedSummary; }

    @JsonProperty("start_date")
    public String startDateSnake() { return startDate; }

    @JsonProperty("end_date")
    public String endDateSnake() { return endDate; }
}
