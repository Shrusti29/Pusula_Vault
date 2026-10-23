package com.pusula.km.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record OverviewMetrics(
        @JsonProperty("totalUsers") int totalUsers,
        @JsonProperty("totalDocuments") int totalDocuments,
        @JsonProperty("totalFiles") int totalFiles,
        @JsonProperty("storageUsedBytes") long storageUsedBytes,
        @JsonProperty("docsCreatedToday") int docsCreatedToday,
        @JsonProperty("docsModifiedToday") int docsModifiedToday,
        @JsonProperty("aiInteractionsLast7d") int aiInteractionsLast7d,
        @JsonProperty("activeUsersLast7d") int activeUsersLast7d,
        @JsonProperty("workspaces") int workspaces
) {
    @JsonProperty("total_users")
    public int totalUsersSnake() { return totalUsers; }

    @JsonProperty("total_documents")
    public int totalDocumentsSnake() { return totalDocuments; }

    @JsonProperty("total_files")
    public int totalFilesSnake() { return totalFiles; }

    @JsonProperty("storage_used_bytes")
    public long storageUsedBytesSnake() { return storageUsedBytes; }

    @JsonProperty("docs_created_today")
    public int docsCreatedTodaySnake() { return docsCreatedToday; }

    @JsonProperty("docs_modified_today")
    public int docsModifiedTodaySnake() { return docsModifiedToday; }

    @JsonProperty("ai_interactions_last7d")
    public int aiInteractionsLast7dSnake() { return aiInteractionsLast7d; }

    @JsonProperty("active_users_last7d")
    public int activeUsersLast7dSnake() { return activeUsersLast7d; }
}
