package com.pusula.km.controller.rest;

import com.pusula.km.model.enums.AuditAction;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.service.impl.AccessScopeService;
import com.pusula.km.service.impl.AuditService;
import com.pusula.km.service.impl.HumanizerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AssistantController {

    private final HumanizerService humanizerService;
    private final AccessScopeService accessScopeService;
    private final AuditService auditService;

    @PostMapping("/ai/humanize")
    public ResponseEntity<ApiResponse<Map<String, String>>> humanize(@RequestBody Map<String, Object> body) {
        var user = accessScopeService.requireUser();
        String text = body.get("text") == null ? "" : String.valueOf(body.get("text"));
        String type = body.get("documentType") == null ? "TEXT" : String.valueOf(body.get("documentType"));
        String tone = body.get("tone") == null ? "Professional" : String.valueOf(body.get("tone"));
        String rewritten = humanizerService.humanize(text, type, tone);
        auditService.log(user.getId(), user.getRole(), AuditAction.AI_HUMANIZATION_REQUEST,
                "Document", null, type, "127.0.0.1", true, null, tone);
        return ResponseEntity.ok(ApiResponse.success(Map.of("text", rewritten), "Document humanized"));
    }

    @PostMapping("/dlp/capture-attempt")
    public ResponseEntity<ApiResponse<Void>> captureAttempt() {
        var user = accessScopeService.requireUser();
        auditService.log(user.getId(), user.getRole(), AuditAction.SCREENSHOT_ATTEMPT,
                "Session", user.getId().toString(), user.getUsername(), "127.0.0.1", false, null, "capture-key");
        return ResponseEntity.ok(ApiResponse.success(null, "Capture attempt recorded"));
    }
}
