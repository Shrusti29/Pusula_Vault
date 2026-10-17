package com.pusula.km.mapper;

import com.pusula.km.model.dto.CommentResponse;
import com.pusula.km.model.entity.Comment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
public class CommentMapper {

    public CommentResponse toResponse(Comment c) {
        if (c == null) return null;
        return new CommentResponse(
                c.getId(),
                c.getDocument() != null ? c.getDocument().getId() : null,
                c.getAuthor() != null ? c.getAuthor().getId() : null,
                c.getAuthor() != null ? c.getAuthor().getDisplayName() : null,
                null,
                c.getContent(),
                c.isResolved(),
                null,
                c.getCreatedAt(),
                c.getUpdatedAt(),
                new ArrayList<CommentResponse>()
        );
    }
}
