package com.pusula.km.controller.rest;

import com.pusula.km.exception.ResourceNotFoundException;
import com.pusula.km.exception.UnauthorizedAccessException;
import com.pusula.km.mapper.CommentMapper;
import com.pusula.km.model.dto.CommentResponse;
import com.pusula.km.model.dto.CreateCommentRequest;
import com.pusula.km.model.dto.ResolveCommentRequest;
import com.pusula.km.model.entity.Comment;
import com.pusula.km.model.entity.Document;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.repository.CommentRepository;
import com.pusula.km.repository.DocumentRepository;
import com.pusula.km.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CommentController {

    private final CommentRepository commentRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final CommentMapper commentMapper;

    private UUID currentUserId() {
        Object p = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (p == null) throw new UnauthorizedAccessException("Not authenticated");
        return (UUID) p;
    }

    private String currentUserName() {
        UUID id = currentUserId();
        return userRepository.findById(id).map(User::getDisplayName).orElse(null);
    }

    @GetMapping("/documents/{id}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(@PathVariable UUID id) {
        List<CommentResponse> comments = commentRepository.findByDocumentId(id).stream()
                .map(commentMapper::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(comments, "Comments fetched successfully"));
    }

    @PostMapping("/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(@RequestBody CreateCommentRequest req) {
        UUID authorId = currentUserId();
        Document doc = documentRepository.findById(req.documentId())
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + req.documentId()));
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authorId));
        Comment c = Comment.builder()
                .document(doc)
                .author(author)
                .content(req.content())
                .anchorPosition(req.anchorPosition())
                .resolved(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        Comment saved = commentRepository.save(c);
        return ResponseEntity.ok(ApiResponse.success(commentMapper.toResponse(saved), "Comment created successfully"));
    }

    @PostMapping("/comments/{id}/resolve")
    public ResponseEntity<ApiResponse<CommentResponse>> resolveComment(
            @PathVariable UUID id,
            @RequestBody ResolveCommentRequest req) {
        Comment c = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + id));
        c.setResolved(req.resolved());
        if (req.resolved()) {
            c.setResolvedBy(currentUserName());
        }
        c.setUpdatedAt(Instant.now());
        Comment saved = commentRepository.save(c);
        return ResponseEntity.ok(ApiResponse.success(commentMapper.toResponse(saved), "Comment resolve status updated"));
    }
}
