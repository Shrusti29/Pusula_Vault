package com.pusula.km.service.authz;

import com.pusula.km.model.enums.Permission;
import com.pusula.km.model.enums.ResourceType;
import com.pusula.km.repository.ResourcePermissionRepository;
import com.pusula.km.repository.TeamMembershipRepository;
import com.pusula.km.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthorizationEngine {

    private final ResourcePermissionRepository resourcePermissionRepository;
    private final TeamMembershipRepository teamMembershipRepository;
    private final UserRepository userRepository;

    public boolean hasPermission(UUID userId, ResourceType resourceType, String resourceId, Permission permission) {
        if (userId == null) {
            return false;
        }
        
        // Founder bypass
        var userOpt = userRepository.findById(userId);
        if (userOpt.isPresent() && userOpt.get().getRole() != null) {
            if (userOpt.get().getRole().name().equals("FOUNDER")) {
                return true;
            }
        }

        // Check direct or team/role permissions
        var perms = resourcePermissionRepository.findByResourceTypeAndResourceId(resourceType, resourceId);
        for (var p : perms) {
            if (p.getPermission() == permission) {
                if (p.getGranteeType().name().equals("USER") && p.getGranteeId().equals(userId.toString())) {
                    return p.isAllow();
                }
            }
        }
        
        // Default deny if no explicit grant
        return false;
    }
}
