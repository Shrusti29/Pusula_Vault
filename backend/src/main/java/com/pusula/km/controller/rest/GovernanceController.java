package com.pusula.km.controller.rest;

import com.pusula.km.exception.ResourceNotFoundException;
import com.pusula.km.model.dto.CreateGovernancePolicyRequest;
import com.pusula.km.model.entity.GovernancePolicy;
import com.pusula.km.model.entity.RetentionRule;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.repository.GovernancePolicyRepository;
import com.pusula.km.repository.RetentionRuleRepository;
import com.pusula.km.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/governance")
@RequiredArgsConstructor
public class GovernanceController {

    private final GovernancePolicyRepository governancePolicyRepository;
    private final RetentionRuleRepository retentionRuleRepository;
    private final UserRepository userRepository;

    private UUID currentUserId() {
        Object p = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (p == null) throw new com.pusula.km.exception.UnauthorizedAccessException("Not authenticated");
        return (UUID) p;
    }

    @GetMapping("/policies")
    public ResponseEntity<ApiResponse<List<GovernancePolicy>>> getAllPolicies() {
        List<GovernancePolicy> policies = governancePolicyRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(policies, "Policies fetched successfully"));
    }

    @GetMapping("/policies/{id}")
    public ResponseEntity<ApiResponse<GovernancePolicy>> getPolicyById(@PathVariable UUID id) {
        GovernancePolicy policy = governancePolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found: " + id));
        return ResponseEntity.ok(ApiResponse.success(policy, "Policy fetched successfully"));
    }

    @PostMapping("/policies")
    public ResponseEntity<ApiResponse<GovernancePolicy>> createPolicy(@RequestBody CreateGovernancePolicyRequest req) {
        User currentUser = userRepository.findById(currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        RetentionRule retentionRule = null;
        if (req.retentionRuleId() != null) {
            retentionRule = retentionRuleRepository.findById(req.retentionRuleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Retention rule not found"));
        }

        String policyName = req.name() != null && !req.name().isBlank() ? req.name() : "Governance Policy";
        String desc = req.description() != null && !req.description().isBlank() ? req.description() : policyName;
        String pText = req.policyText() != null && !req.policyText().isBlank() ? req.policyText() : policyName;
        com.pusula.km.model.enums.SensitivityLevel sensLevel = req.sensitivityLevel() != null ? req.sensitivityLevel() : com.pusula.km.model.enums.SensitivityLevel.INTERNAL;

        GovernancePolicy policy = GovernancePolicy.builder()
                .name(policyName)
                .description(desc)
                .sensitivityLevel(sensLevel)
                .retentionRule(retentionRule)
                .policyText(pText)
                .createdBy(currentUser)
                .active(true)
                .enforceOnCreate(req.enforceOnCreate())
                .enforceOnEdit(req.enforceOnEdit())
                .requireApproval(req.requireApproval())
                .build();

        GovernancePolicy saved = governancePolicyRepository.save(policy);
        return ResponseEntity.ok(ApiResponse.success(saved, "Policy created successfully"));
    }

    @PutMapping("/policies/{id}/active")
    public ResponseEntity<ApiResponse<GovernancePolicy>> setPolicyActive(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, Object> body) {
        GovernancePolicy policy = governancePolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found: " + id));
        boolean active = body != null && body.containsKey("active") ? Boolean.TRUE.equals(body.get("active")) : false;
        policy.setActive(active);
        GovernancePolicy saved = governancePolicyRepository.save(policy);
        return ResponseEntity.ok(ApiResponse.success(saved, "Policy active status updated"));
    }

    @GetMapping("/retention-rules")
    public ResponseEntity<ApiResponse<List<RetentionRule>>> getAllRetentionRules() {
        List<RetentionRule> rules = retentionRuleRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(rules, "Retention rules fetched successfully"));
    }

    @PostMapping("/retention-rules")
    public ResponseEntity<ApiResponse<RetentionRule>> createRetentionRule(@RequestBody com.pusula.km.model.dto.CreateRetentionRuleRequest req) {
        String ruleName = req.name() != null && !req.name().isBlank() ? req.name() : "Retention Rule";
        String desc = req.description() != null && !req.description().isBlank() ? req.description() : ruleName;
        Integer retDays = req.retentionDays() != null ? req.retentionDays() : 365;
        String docTypes = req.applicableDocumentTypes() != null && !req.applicableDocumentTypes().isBlank() ? req.applicableDocumentTypes() : "ALL";

        RetentionRule rule = RetentionRule.builder()
                .name(ruleName)
                .description(desc)
                .retentionDays(retDays)
                .autoArchive(req.autoArchive())
                .autoDelete(req.autoDelete())
                .applicableDocumentTypes(docTypes)
                .build();

        RetentionRule saved = retentionRuleRepository.save(rule);
        return ResponseEntity.ok(ApiResponse.success(saved, "Retention rule created successfully"));
    }
}
