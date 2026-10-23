package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ActivityPeriodBucket(
        @JsonProperty("date") String date,
        @JsonProperty("created") int created,
        @JsonProperty("edited") int edited,
        @JsonProperty("viewed") int viewed,
        @JsonProperty("uploaded") int uploaded,
        @JsonProperty("downloaded") int downloaded,
        @JsonProperty("aiInteractions") int aiInteractions
) {
    @JsonProperty("ai_interactions")
    public int aiInteractionsSnake() { return aiInteractions; }
}
