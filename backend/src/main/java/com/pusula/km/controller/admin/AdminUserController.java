package com.pusula.km.controller.admin;

import com.pusula.km.exception.ResourceNotFoundException;
import com.pusula.km.exception.UnauthorizedAccessException;
import com.pusula.km.mapper.UserMapper;
import com.pusula.km.model.dto.ChangeRoleRequest;
import com.pusula.km.model.dto.CreateUserRequest;
import com.pusula.km.model.dto.UpdateUserRequest;
import com.pusula.km.model.dto.UserResponse;
import com.pusula.km.model.enums.Role;
import com.pusula.km.service.impl.AccessScopeService;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.model.response.PaginatedResponse;
import com.pusula.km.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AccessScopeService accessScopeService;

    private UUID currentUserId() {
        Object p = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (p == null) throw new UnauthorizedAccessException("Not authenticated");
        return (UUID) p;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> userPage = userRepository.findAll(pageable);
        List<UserResponse> content = userPage.getContent().stream().map(userMapper::toResponse).toList();
        PaginatedResponse<UserResponse> paginated = new PaginatedResponse<>(
                content,
                userPage.getTotalElements(),
                userPage.getTotalPages(),
                userPage.getSize(),
                userPage.getNumber(),
                userPage.isFirst(),
                userPage.isLast()
        );
        return ResponseEntity.ok(ApiResponse.success(paginated, "Users fetched successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(user), "User fetched successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@RequestBody CreateUserRequest req) {
        java.util.Set<String> permissions = req.featurePermissions() != null ? req.featurePermissions() : java.util.Set.of();
        if ((req.role() == Role.EMPLOYEE || req.role() == Role.INTERN) && permissions.isEmpty()) {
            permissions = java.util.Set.of("VIEW_WORKSPACES", "VIEW_DOCUMENTS", "CREATE_DOCUMENTS", "EDIT_DOCUMENTS");
        }
        User user = User.builder()
                .username(req.username())
                .email(req.email())
                .displayName(req.fullName())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(req.role())
                .active(true)
                .featurePermissions(permissions)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        User saved = userRepository.save(user);
        accessScopeService.replaceGrants(saved.getId(), req.workspaceIds());
        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(saved), "User created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable UUID id,
            @RequestBody UpdateUserRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        if (req.fullName() != null) user.setDisplayName(req.fullName());
        if (req.email() != null) user.setEmail(req.email());
        if (req.role() != null) user.setRole(req.role());
        if (req.password() != null && !req.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        if (req.featurePermissions() != null) user.setFeaturePermissions(req.featurePermissions());
        if (req.active() != null) user.setActive(req.active());
        user.setUpdatedAt(Instant.now());
        User saved = userRepository.save(user);
        if (req.workspaceIds() != null) {
            accessScopeService.replaceGrants(saved.getId(), req.workspaceIds());
        }
        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(saved), "User updated"));
    }

    @PutMapping("/{id}/active")
    public ResponseEntity<ApiResponse<UserResponse>> setActive(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        boolean active = body != null && body.containsKey("active") ? Boolean.TRUE.equals(body.get("active")) : false;
        user.setActive(active);
        user.setUpdatedAt(Instant.now());
        User saved = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(saved), "User active status updated"));
    }

    @PostMapping("/role")
    public ResponseEntity<ApiResponse<UserResponse>> changeRole(@RequestBody ChangeRoleRequest req) {
        User user = userRepository.findById(req.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + req.userId()));
        user.setRole(req.newRole());
        user.setUpdatedAt(Instant.now());
        User saved = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(saved), "User role changed successfully"));
    }
}
