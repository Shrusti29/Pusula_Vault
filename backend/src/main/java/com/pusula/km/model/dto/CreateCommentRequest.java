package com.pusula.km.model.dto;

import java.util.UUID;

public record CreateCommentRequest(
        UUID documentId,
        String anchorPosition,
        String content
) {}
