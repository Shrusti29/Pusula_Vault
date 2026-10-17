package com.pusula.km.service.impl;

import com.pusula.km.model.dto.AccessInspectorExplainResponse;
import com.pusula.km.model.enums.Permission;
import com.pusula.km.model.enums.ResourceType;
import com.pusula.km.repository.ResourcePermissionRepository;
import com.pusula.km.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccessInspectorService {

    private final ResourcePermissionRepository resourcePermissionRepository;
    private final UserRepository userRepository;

    public AccessInspectorExplainResponse explain(UUID userId, ResourceType resourceType, String resourceId) {
        List<String> sources = new ArrayList<>();
        
        var userOpt = userRepository.findById(userId);
        if (userOpt.isPresent() && userOpt.get().getRole() != null) {
            if (userOpt.get().getRole().name().equals("FOUNDER")) {
                sources.add("FOUNDER_BYPASS: Role is FOUNDER");
                return new AccessInspectorExplainResponse(true, sources);
            }
            if (userOpt.get().getRole().name().equals("ADMIN")) {
                sources.add("ADMIN_IDENTITY_GOVERNANCE: Role is ADMIN");
            }
        }

        var perms = resourcePermissionRepository.findByResourceTypeAndResourceId(resourceType, resourceId);
        boolean allowed = false;
        for (var p : perms) {
            if (p.getGranteeType().name().equals("USER") && p.getGranteeId().equals(userId.toString())) {
                if (p.isAllow()) {
                    allowed = true;
                    sources.add("DIRECT_USER_GRANT: Permission " + p.getPermission() + " ALLOW");
                } else {
                    sources.add("DIRECT_USER_DENY: Permission " + p.getPermission() + " DENY (Overrides)");
                    return new AccessInspectorExplainResponse(false, sources);
                }
            }
        }

        return new AccessInspectorExplainResponse(allowed, sources);
    }
}
