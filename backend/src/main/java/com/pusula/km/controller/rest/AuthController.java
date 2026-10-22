package com.pusula.km.controller.rest;

import com.pusula.km.exception.ResourceNotFoundException;
import com.pusula.km.exception.UnauthorizedAccessException;
import com.pusula.km.mapper.UserMapper;
import com.pusula.km.model.entity.TrustedDevice;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.entity.Workspace;
import com.pusula.km.model.enums.DeviceStatus;
import com.pusula.km.model.request.LoginRequest;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.model.response.LoginResponse;
import com.pusula.km.repository.TrustedDeviceRepository;
import com.pusula.km.repository.UserRepository;
import com.pusula.km.security.jwt.JwtTokenProvider;
import com.pusula.km.service.impl.AccessScopeService;
import com.pusula.km.service.impl.AuditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final TrustedDeviceRepository trustedDeviceRepository;
    private final AuditService auditService;
    private final UserMapper userMapper;
    private final AccessScopeService accessScopeService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email().trim().toLowerCase(), request.password())
            );

            User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            if (!user.isActive()) {
                throw new UnauthorizedAccessException("This account is inactive");
            }

            String deviceStatus = registerDevice(user, request.deviceId(), request.deviceLabel());
            if ("REVOKED".equals(deviceStatus)) {
                throw new UnauthorizedAccessException("This device was revoked. Ask an admin to approve it again.");
            }

            auditService.log(user.getId(), user.getRole(), com.pusula.km.model.enums.AuditAction.LOGIN_SUCCESS,
                    "User", user.getId().toString(), user.getEmail(), "127.0.0.1", true, null, deviceStatus);

            String token = tokenProvider.createToken(user.getId(), user.getUsername(), user.getRole().name());
            return ResponseEntity.ok(ApiResponse.success(session(user, token, "APPROVED", "Login successful"), "Login successful"));
        } catch (BadCredentialsException e) {
            userRepository.findByEmailIgnoreCase(request.email().trim()).ifPresent(user ->
                auditService.log(user.getId(), user.getRole(), com.pusula.km.model.enums.AuditAction.LOGIN_FAILURE,
                        "User", user.getId().toString(), user.getEmail(), "127.0.0.1", false, null, null)
            );
            throw new UnauthorizedAccessException("Invalid email or password");
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (UnauthorizedAccessException e) {
            throw e;
        } catch (Exception e) {
            userRepository.findByEmailIgnoreCase(request.email().trim()).ifPresent(user ->
                auditService.log(user.getId(), user.getRole(), com.pusula.km.model.enums.AuditAction.LOGIN_FAILURE,
                        "User", user.getId().toString(), user.getEmail(), "127.0.0.1", false, null, null)
            );
            throw new UnauthorizedAccessException("Authentication failed");
        }
    }

    @GetMapping("/device-status")
    public ResponseEntity<ApiResponse<LoginResponse>> deviceStatus(
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId) {
        User user = accessScopeService.requireUser();
        String token = tokenProvider.createToken(user.getId(), user.getUsername(), user.getRole().name());
        return ResponseEntity.ok(ApiResponse.success(session(user, token, "APPROVED", "Login successful"), "Approved"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    private LoginResponse session(User user, String token, String status, String message) {
        List<UUID> visible = accessScopeService.visibleWorkspaces(user).stream().map(Workspace::getId).toList();
        return new LoginResponse(token, userMapper.toResponse(user), visible, user.getRole(), status, message);
    }

    private String registerDevice(User user, String deviceId, String label) {
        String devId = (deviceId != null && !deviceId.isBlank()) ? deviceId.trim() : "DEV-" + UUID.randomUUID().toString().substring(0, 8);
        Instant now = Instant.now();
        TrustedDevice device = trustedDeviceRepository.findByUserIdAndDeviceId(user.getId(), devId)
                .orElseGet(() -> TrustedDevice.builder()
                        .userId(user.getId())
                        .deviceId(devId)
                        .status(DeviceStatus.APPROVED)
                        .firstSeenAt(now)
                        .approvedAt(now)
                        .build());
        device.setLabel(label == null ? "Browser" : label.substring(0, Math.min(label.length(), 160)));
        device.setLastSeenAt(now);
        if (device.getStatus() == null || device.getStatus() == DeviceStatus.PENDING) {
            device.setStatus(DeviceStatus.APPROVED);
            device.setApprovedAt(now);
        }
        trustedDeviceRepository.save(device);
        return device.getStatus().name();
    }
}
