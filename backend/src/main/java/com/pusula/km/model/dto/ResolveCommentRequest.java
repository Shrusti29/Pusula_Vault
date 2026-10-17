package com.pusula.km.model.dto;

import java.util.UUID;

public record ResolveCommentRequest(
        UUID commentId,
        boolean resolved
) {}
