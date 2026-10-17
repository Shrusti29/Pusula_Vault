package com.pusula.km.model.dto;

public record OverviewMetrics(
        int totalUsers,
        int totalDocuments,
        int totalFiles,
        long storageUsedBytes,
        int docsCreatedToday,
        int docsModifiedToday,
        int aiInteractionsLast7d,
        int activeUsersLast7d,
        int workspaces
) {}
