package com.pusula.km.controller.rest;

import com.pusula.km.model.dto.TagResponse;
import com.pusula.km.model.entity.Tag;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class TagsController {

    private final TagRepository tagRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TagResponse>>> getTags(
            @RequestParam(required = false) UUID workspaceId) {
        List<TagResponse> tags = tagRepository.findAll().stream()
                .map((Tag t) -> new TagResponse(t.getId(), t.getName(), 0)).toList();
        return ResponseEntity.ok(ApiResponse.success(tags, "Tags fetched successfully"));
    }
}
