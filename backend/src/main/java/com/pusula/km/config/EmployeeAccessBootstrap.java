package com.pusula.km.config;

import com.pusula.km.model.entity.User;
import com.pusula.km.model.entity.Workspace;
import com.pusula.km.model.entity.WorkspaceGrant;
import com.pusula.km.model.enums.Role;
import com.pusula.km.repository.UserRepository;
import com.pusula.km.repository.WorkspaceGrantRepository;
import com.pusula.km.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Set;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class EmployeeAccessBootstrap implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceGrantRepository workspaceGrantRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername("founder").isEmpty()) {
            userRepository.save(User.builder()
                    .username("founder")
                    .email("founder@pusula.com")
                    .displayName("Founder")
                    .passwordHash(passwordEncoder.encode("founder123"))
                    .role(Role.FOUNDER)
                    .active(true)
                    .featurePermissions(Set.of(
                            "VIEW_WORKSPACES", "CREATE_WORKSPACES", "DELETE_WORKSPACES",
                            "VIEW_DOCUMENTS", "CREATE_DOCUMENTS", "EDIT_DOCUMENTS", "DELETE_DOCUMENTS",
                            "VIEW_AUDIT_LOGS", "VIEW_ANALYTICS", "GOVERNANCE_CONTROLS",
                            "MANAGE_USERS", "MANAGE_ROLES", "MANAGE_TEAMS"
                    ))
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build());
            log.info("Seeded founder account");
        }

        userRepository.findByUsername("employee").ifPresent(employee -> {
            if (!workspaceGrantRepository.findByUserId(employee.getId()).isEmpty()) {
                return;
            }
            workspaceRepository.findAll().stream()
                    .filter(ws -> "Engineering".equals(ws.getName()))
                    .findFirst()
                    .ifPresent(ws -> grant(employee, ws));
        });
    }

    private void grant(User employee, Workspace workspace) {
        workspaceGrantRepository.save(WorkspaceGrant.builder()
                .userId(employee.getId())
                .workspaceId(workspace.getId())
                .canEdit(true)
                .canCreate(true)
                .build());
        log.info("Granted employee access to {}", workspace.getName());
    }
}
