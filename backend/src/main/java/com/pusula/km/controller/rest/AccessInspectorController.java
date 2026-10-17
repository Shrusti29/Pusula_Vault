package com.pusula.km.controller.rest;

import com.pusula.km.model.dto.AccessInspectorExplainResponse;
import com.pusula.km.model.enums.ResourceType;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.service.impl.AccessInspectorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/access")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN') or hasRole('FOUNDER')")
public class AccessInspectorController {

    private final AccessInspectorService accessInspectorService;

    @GetMapping("/explain")
    public ResponseEntity<ApiResponse<AccessInspectorExplainResponse>> explainAccess(
            @RequestParam UUID userId,
            @RequestParam ResourceType resourceType,
            @RequestParam String resourceId) {
        AccessInspectorExplainResponse response = accessInspectorService.explain(userId, resourceType, resourceId);
        return ResponseEntity.ok(ApiResponse.success(response, "Access explained successfully"));
    }
}
