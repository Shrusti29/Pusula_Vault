package com.pusula.km.controller.rest;

import com.pusula.km.model.entity.ProgressReport;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.repository.ProgressReportRepository;
import com.pusula.km.service.impl.AccessScopeService;
import com.pusula.km.service.impl.VaultKnowledgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vault")
@RequiredArgsConstructor
public class VaultController {

    private final VaultKnowledgeService knowledgeService;
    private final ProgressReportRepository progressReportRepository;
    private final AccessScopeService accessScopeService;

    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ask(@RequestBody Map<String, Object> body) {
        String question = body == null || body.get("question") == null ? "" : String.valueOf(body.get("question"));
        return ResponseEntity.ok(ApiResponse.success(knowledgeService.ask(question), "Answered from vault documents"));
    }

    @PostMapping("/presence")
    public ResponseEntity<ApiResponse<Void>> presence(@RequestBody Map<String, Object> body) {
        User user = accessScopeService.requireUser();
        UUID documentId = null;
        if (body != null && body.get("documentId") != null && !String.valueOf(body.get("documentId")).isBlank()) {
            documentId = UUID.fromString(String.valueOf(body.get("documentId")));
        }
        knowledgeService.heartbeat(user.getId(), documentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Presence updated"));
    }

    @GetMapping("/presence")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> presence() {
        return ResponseEntity.ok(ApiResponse.success(knowledgeService.activePeople(), "Presence"));
    }

    @GetMapping("/actions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> actions(@RequestParam(defaultValue = "80") int limit) {
        return ResponseEntity.ok(ApiResponse.success(knowledgeService.recentActions(limit), "Actions"));
    }

    @GetMapping("/projects")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> projects() {
        return ResponseEntity.ok(ApiResponse.success(knowledgeService.projectStats(), "Project stats"));
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> reports() {
        knowledgeService.requireLeadership();
        List<Map<String, Object>> rows = progressReportRepository.findAllByOrderByCreatedAtDesc().stream().map(this::reportRow).toList();
        return ResponseEntity.ok(ApiResponse.success(rows, "Reports"));
    }

    @PostMapping("/reports")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createReport(@RequestBody Map<String, Object> body) {
        String period = body != null && body.get("period") != null ? String.valueOf(body.get("period")) : "DAILY";
        String notes = body != null && body.get("notes") != null ? String.valueOf(body.get("notes")) : "";
        return ResponseEntity.ok(ApiResponse.success(reportRow(knowledgeService.saveReport(period, notes)), "Report saved"));
    }

    private Map<String, Object> reportRow(ProgressReport report) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", report.getId());
        row.put("period", report.getPeriod());
        row.put("periodStart", report.getPeriodStart());
        row.put("periodEnd", report.getPeriodEnd());
        row.put("generatedSummary", report.getGeneratedSummary());
        row.put("authorNotes", report.getAuthorNotes());
        row.put("createdAt", report.getCreatedAt());
        return row;
    }
}
