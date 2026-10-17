package com.pusula.km.mapper;

import com.pusula.km.model.dto.UserResponse;
import com.pusula.km.model.entity.User;
import com.pusula.km.service.impl.AccessScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserMapper {

    private final AccessScopeService accessScopeService;

    public UserResponse toResponse(User user) {
        if (user == null) return null;
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getDisplayName(),
                user.isActive(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.getFeaturePermissions() == null ? java.util.Set.of() : user.getFeaturePermissions(),
                accessScopeService.grantedWorkspaceIds(user.getId())
        );
    }
}
