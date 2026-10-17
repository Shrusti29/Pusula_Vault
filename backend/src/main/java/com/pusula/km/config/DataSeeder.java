package com.pusula.km.config;

import com.pusula.km.model.entity.*;
import com.pusula.km.model.enums.*;
import com.pusula.km.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@Order(0)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final DocumentRepository documentRepository;
    private final FolderRepository folderRepository;
    private final AuditLogRepository auditLogRepository;
    private final GovernancePolicyRepository governancePolicyRepository;
    private final RetentionRuleRepository retentionRuleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded, skipping...");
            return;
        }

        log.info("Starting data seeding...");

        seedUsers();
        seedWorkspaces();
        seedDocuments();
        seedGovernancePolicies();
        seedAuditLogs();

        log.info("Data seeding completed!");
    }

    private void seedUsers() {
        User admin = User.builder()
                .username("admin")
                .email("admin@pusula.com")
                .displayName("System Administrator")
                .passwordHash(passwordEncoder.encode("admin123"))
                .role(com.pusula.km.model.enums.Role.ADMIN)
                .active(true)
                .featurePermissions(Set.of(
                    "VIEW_WORKSPACES", "CREATE_WORKSPACES", "DELETE_WORKSPACES",
                    "VIEW_DOCUMENTS", "CREATE_DOCUMENTS", "EDIT_DOCUMENTS", "DELETE_DOCUMENTS",
                    "VIEW_AUDIT_LOGS", "VIEW_ANALYTICS", "GOVERNANCE_CONTROLS", "DRIVE_SYNC",
                    "MANAGE_USERS", "MANAGE_ROLES", "MANAGE_TEAMS"
                ))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        User manager = User.builder()
                .username("manager")
                .email("manager@pusula.com")
                .displayName("Project Manager")
                .passwordHash(passwordEncoder.encode("manager123"))
                .role(com.pusula.km.model.enums.Role.MANAGER)
                .active(true)
                .featurePermissions(Set.of(
                    "VIEW_WORKSPACES", "CREATE_WORKSPACES",
                    "VIEW_DOCUMENTS", "CREATE_DOCUMENTS", "EDIT_DOCUMENTS",
                    "VIEW_AUDIT_LOGS", "VIEW_ANALYTICS", "GOVERNANCE_CONTROLS"
                ))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        User employee = User.builder()
                .username("employee")
                .email("employee@pusula.com")
                .displayName("Regular Employee")
                .passwordHash(passwordEncoder.encode("employee123"))
                .role(com.pusula.km.model.enums.Role.EMPLOYEE)
                .active(true)
                .featurePermissions(Set.of(
                    "VIEW_WORKSPACES",
                    "VIEW_DOCUMENTS", "CREATE_DOCUMENTS", "EDIT_DOCUMENTS"
                ))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        userRepository.save(admin);
        userRepository.save(manager);
        userRepository.save(employee);

        log.info("Seeded 3 users");
    }

    private void seedWorkspaces() {
        User admin = userRepository.findByUsername("admin").orElseThrow();

        Workspace engineering = Workspace.builder()
                .name("Engineering")
                .description("Software development and technical documentation")
                .createdBy(admin)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Workspace marketing = Workspace.builder()
                .name("Marketing")
                .description("Marketing materials and campaigns")
                .createdBy(admin)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Workspace finance = Workspace.builder()
                .name("Finance")
                .description("Financial reports and budgets")
                .createdBy(admin)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        workspaceRepository.saveAll(List.of(engineering, marketing, finance));

        log.info("Seeded 3 workspaces");
    }

    private void seedDocuments() {
        User admin = userRepository.findByUsername("admin").orElseThrow();
        List<Workspace> workspaces = workspaceRepository.findAll();
        Workspace engineering = workspaces.stream().filter(w -> w.getName().equals("Engineering")).findFirst().orElseThrow();
        Workspace marketing = workspaces.stream().filter(w -> w.getName().equals("Marketing")).findFirst().orElseThrow();
        Workspace finance = workspaces.stream().filter(w -> w.getName().equals("Finance")).findFirst().orElseThrow();

        Document doc1 = Document.builder()
                .title("API Documentation")
                .content("# API Documentation\n\n## Overview\nThis document describes the REST API endpoints...")
                .contentType("text/markdown")
                .documentType(DocumentType.CODEBASE)
                .sensitivityLevel(SensitivityLevel.INTERNAL)
                .workspace(engineering)
                .createdBy(admin)
                .status(DocumentStatus.ACTIVE)
                .currentVersion(1)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Document doc2 = Document.builder()
                .title("Q4 Marketing Strategy")
                .content("# Q4 Marketing Strategy\n\n## Goals\n- Increase brand awareness\n- Generate 50% more leads...")
                .contentType("text/markdown")
                .documentType(DocumentType.WORD)
                .sensitivityLevel(SensitivityLevel.CONFIDENTIAL)
                .workspace(marketing)
                .createdBy(admin)
                .status(DocumentStatus.ACTIVE)
                .currentVersion(1)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Document doc3 = Document.builder()
                .title("Financial Budget 2024")
                .content("# Financial Budget 2024\n\n## Revenue Projections\n\n| Quarter | Revenue |\n|---------|---------|\n| Q1 | $1.2M |...")
                .contentType("text/markdown")
                .documentType(DocumentType.EXCEL)
                .sensitivityLevel(SensitivityLevel.RESTRICTED)
                .workspace(finance)
                .createdBy(admin)
                .status(DocumentStatus.ACTIVE)
                .currentVersion(1)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Document doc4 = Document.builder()
                .title("Product Roadmap Presentation")
                .content("# Product Roadmap\n\n## Q1 Features\n- User authentication\n- Document management...")
                .contentType("text/markdown")
                .documentType(DocumentType.POWERPOINT)
                .sensitivityLevel(SensitivityLevel.INTERNAL)
                .workspace(engineering)
                .createdBy(admin)
                .status(DocumentStatus.DRAFT)
                .currentVersion(1)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Document doc5 = Document.builder()
                .title("Employee Onboarding Form")
                .content("# Employee Onboarding Form\n\n## Personal Information\n\n- Full Name\n- Email Address...")
                .contentType("text/markdown")
                .documentType(DocumentType.CUSTOM_FORM)
                .sensitivityLevel(SensitivityLevel.INTERNAL)
                .workspace(engineering)
                .createdBy(admin)
                .status(DocumentStatus.ACTIVE)
                .currentVersion(1)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        documentRepository.save(doc1);
        documentRepository.save(doc2);
        documentRepository.save(doc3);
        documentRepository.save(doc4);
        documentRepository.save(doc5);

        log.info("Seeded 5 documents");
    }

    private void seedGovernancePolicies() {
        RetentionRule standardRule = RetentionRule.builder()
                .name("Standard Retention")
                .description("7-year retention for standard documents")
                .retentionDays(2555)
                .autoArchive(true)
                .autoDelete(false)
                .applicableDocumentTypes("WORD,EXCEL,PDF")
                .createdAt(Instant.now())
                .build();

        RetentionRule confidentialRule = RetentionRule.builder()
                .name("Confidential Retention")
                .description("10-year retention for confidential documents")
                .retentionDays(3650)
                .autoArchive(true)
                .autoDelete(false)
                .applicableDocumentTypes("WORD,EXCEL,PDF,CODEBASE")
                .createdAt(Instant.now())
                .build();

        retentionRuleRepository.save(standardRule);
        retentionRuleRepository.save(confidentialRule);

        User admin = userRepository.findByUsername("admin").orElseThrow();

        GovernancePolicy policy1 = GovernancePolicy.builder()
                .name("Document Classification Policy")
                .description("All documents must be classified with appropriate sensitivity levels")
                .sensitivityLevel(SensitivityLevel.INTERNAL)
                .retentionRule(standardRule)
                .policyText("All documents created in the system must be classified with one of the following sensitivity levels: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED, or TOP_SECRET.")
                .createdBy(admin)
                .active(true)
                .enforceOnCreate(true)
                .enforceOnEdit(true)
                .requireApproval(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        GovernancePolicy policy2 = GovernancePolicy.builder()
                .name("Confidential Data Handling")
                .description("Strict controls for confidential document handling")
                .sensitivityLevel(SensitivityLevel.CONFIDENTIAL)
                .retentionRule(confidentialRule)
                .policyText("Confidential documents require explicit approval for sharing outside the organization. All access is logged and audited.")
                .createdBy(admin)
                .active(true)
                .enforceOnCreate(true)
                .enforceOnEdit(true)
                .requireApproval(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        governancePolicyRepository.save(policy1);
        governancePolicyRepository.save(policy2);

        log.info("Seeded 2 retention rules and 2 governance policies");
    }

    private void seedAuditLogs() {
        User admin = userRepository.findByUsername("admin").orElseThrow();

        AuditLog log1 = AuditLog.builder()
                .actorUserId(admin.getId())
                .actorRole(com.pusula.km.model.enums.Role.ADMIN)
                .action(AuditAction.USER_CREATED)
                .entityType("User")
                .entityId(admin.getId().toString())
                .entityName("admin")
                .ip("127.0.0.1")
                .userAgent("Mozilla/5.0")
                .sessionId(UUID.randomUUID().toString())
                .success(true)
                .timestamp(Instant.now())
                .build();

        AuditLog log2 = AuditLog.builder()
                .actorUserId(admin.getId())
                .actorRole(com.pusula.km.model.enums.Role.ADMIN)
                .action(AuditAction.WORKSPACE_CREATED)
                .entityType("Workspace")
                .entityId(UUID.randomUUID().toString())
                .entityName("Engineering")
                .ip("127.0.0.1")
                .userAgent("Mozilla/5.0")
                .sessionId(UUID.randomUUID().toString())
                .success(true)
                .timestamp(Instant.now())
                .build();

        AuditLog log3 = AuditLog.builder()
                .actorUserId(admin.getId())
                .actorRole(com.pusula.km.model.enums.Role.ADMIN)
                .action(AuditAction.DOCUMENT_CREATED)
                .entityType("Document")
                .entityId(UUID.randomUUID().toString())
                .entityName("API Documentation")
                .ip("127.0.0.1")
                .userAgent("Mozilla/5.0")
                .sessionId(UUID.randomUUID().toString())
                .success(true)
                .timestamp(Instant.now())
                .build();

        AuditLog log4 = AuditLog.builder()
                .actorUserId(admin.getId())
                .actorRole(com.pusula.km.model.enums.Role.ADMIN)
                .action(AuditAction.LOGIN_SUCCESS)
                .entityType("User")
                .entityId(admin.getId().toString())
                .entityName("admin")
                .ip("127.0.0.1")
                .userAgent("Mozilla/5.0")
                .sessionId(UUID.randomUUID().toString())
                .success(true)
                .timestamp(Instant.now())
                .build();

        AuditLog log5 = AuditLog.builder()
                .actorUserId(admin.getId())
                .actorRole(com.pusula.km.model.enums.Role.ADMIN)
                .action(AuditAction.DOCUMENT_VIEWED)
                .entityType("Document")
                .entityId(UUID.randomUUID().toString())
                .entityName("API Documentation")
                .ip("127.0.0.1")
                .userAgent("Mozilla/5.0")
                .sessionId(UUID.randomUUID().toString())
                .success(true)
                .timestamp(Instant.now())
                .build();

        auditLogRepository.save(log1);
        auditLogRepository.save(log2);
        auditLogRepository.save(log3);
        auditLogRepository.save(log4);
        auditLogRepository.save(log5);

        log.info("Seeded 5 audit logs");
    }
}
