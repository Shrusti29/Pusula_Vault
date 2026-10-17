package com.pusula.km.model.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        UUID documentId,
        UUID authorId,
        String authorName,
        String anchorPosition,
        String content,
        boolean resolved,
        String resolvedBy,
        Instant createdAt,
        Instant updatedAt,
        List<CommentResponse> replies
) {}
