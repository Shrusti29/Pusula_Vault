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
import org.springframework.stereotype.Component;


@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class EmployeeAccessBootstrap implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceGrantRepository workspaceGrantRepository;
    @Override
    public void run(String... args) {
        userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.EMPLOYEE || user.getRole() == Role.INTERN)
                .findFirst().ifPresent(employee -> {
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
