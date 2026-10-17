package com.pusula.km.service.impl;

import com.pusula.km.exception.ForbiddenException;
import com.pusula.km.exception.UnauthorizedAccessException;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.entity.Workspace;
import com.pusula.km.model.entity.WorkspaceGrant;
import com.pusula.km.model.enums.Role;
import com.pusula.km.repository.UserRepository;
import com.pusula.km.repository.WorkspaceGrantRepository;
import com.pusula.km.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccessScopeService {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceGrantRepository workspaceGrantRepository;

    public User requireUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth != null ? auth.getPrincipal() : null;
        if (!(principal instanceof UUID id)) {
            throw new UnauthorizedAccessException("Not authenticated");
        }
        return userRepository.findById(id)
                .orElseThrow(() -> new UnauthorizedAccessException("Not authenticated"));
    }

    public boolean isLeadership(User user) {
        Role role = user.getRole();
        return role == Role.FOUNDER || role == Role.ADMIN;
    }

    public boolean isScopedEmployee(User user) {
        Role role = user.getRole();
        return role == Role.EMPLOYEE || role == Role.INTERN;
    }

    public boolean needsDeviceApproval(User user) {
        return isScopedEmployee(user);
    }

    public boolean canDownload(User user) {
        return user != null && !isScopedEmployee(user);
    }

    public boolean canCopy(User user) {
        return canDownload(user);
    }

    public List<Workspace> visibleWorkspaces(User user) {
        if (isLeadership(user)) {
            return workspaceRepository.findAll();
        }
        List<WorkspaceGrant> grants = workspaceGrantRepository.findByUserId(user.getId());
        if (grants.isEmpty()) {
            return isScopedEmployee(user) ? List.of() : workspaceRepository.findAll();
        }
        List<UUID> ids = grants.stream().map(WorkspaceGrant::getWorkspaceId).toList();
        return workspaceRepository.findAllById(ids);
    }

    public void assertCanView(User user, UUID workspaceId) {
        if (workspaceId == null) {
            throw new ForbiddenException("Workspace is required");
        }
        if (isLeadership(user)) {
            return;
        }
        List<WorkspaceGrant> grants = workspaceGrantRepository.findByUserId(user.getId());
        if (grants.isEmpty() && !isScopedEmployee(user)) {
            return;
        }
        boolean allowed = grants.stream().anyMatch(g -> workspaceId.equals(g.getWorkspaceId()));
        if (!allowed) {
            throw new ForbiddenException("You do not have access to this workspace");
        }
    }

    public void assertCanEdit(User user, UUID workspaceId) {
        assertCanView(user, workspaceId);
        if (isLeadership(user)) {
            return;
        }
        workspaceGrantRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId).ifPresent(grant -> {
            if (!grant.isCanEdit()) {
                throw new ForbiddenException("You can view this workspace but not edit it");
            }
        });
    }

    public void assertCanCreate(User user, UUID workspaceId) {
        assertCanView(user, workspaceId);
        if (!isScopedEmployee(user) && isLeadership(user)) {
            return;
        }
        WorkspaceGrant grant = workspaceGrantRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId).orElse(null);
        if (isScopedEmployee(user) && (grant == null || !grant.isCanCreate())) {
            throw new ForbiddenException("You cannot create documents in this workspace");
        }
    }

    @Transactional
    public void replaceGrants(UUID userId, List<UUID> workspaceIds) {
        workspaceGrantRepository.deleteByUserId(userId);
        if (workspaceIds == null) {
            return;
        }
        for (UUID workspaceId : workspaceIds) {
            if (workspaceId == null || !workspaceRepository.existsById(workspaceId)) {
                continue;
            }
            workspaceGrantRepository.save(WorkspaceGrant.builder()
                    .userId(userId)
                    .workspaceId(workspaceId)
                    .canEdit(true)
                    .canCreate(true)
                    .build());
        }
    }

    public List<UUID> grantedWorkspaceIds(UUID userId) {
        return workspaceGrantRepository.findByUserId(userId).stream().map(WorkspaceGrant::getWorkspaceId).toList();
    }
}
