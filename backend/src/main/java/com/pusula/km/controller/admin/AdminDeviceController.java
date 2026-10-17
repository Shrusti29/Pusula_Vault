package com.pusula.km.controller.admin;

import com.pusula.km.exception.ForbiddenException;
import com.pusula.km.exception.ResourceNotFoundException;
import com.pusula.km.model.entity.TrustedDevice;
import com.pusula.km.model.entity.User;
import com.pusula.km.model.enums.DeviceStatus;
import com.pusula.km.model.response.ApiResponse;
import com.pusula.km.repository.TrustedDeviceRepository;
import com.pusula.km.repository.UserRepository;
import com.pusula.km.service.impl.AccessScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/devices")
@RequiredArgsConstructor
public class AdminDeviceController {

    private final TrustedDeviceRepository trustedDeviceRepository;
    private final UserRepository userRepository;
    private final AccessScopeService accessScopeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DeviceView>>> list() {
        requireAdmin();
        List<DeviceView> rows = trustedDeviceRepository.findAllByOrderByFirstSeenAtDesc().stream()
                .map(this::toView)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(rows, "Devices fetched"));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<DeviceView>> approve(@PathVariable UUID id) {
        User admin = requireAdmin();
        TrustedDevice device = trustedDeviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Device not found"));
        device.setStatus(DeviceStatus.APPROVED);
        device.setApprovedBy(admin.getId());
        device.setApprovedAt(Instant.now());
        return ResponseEntity.ok(ApiResponse.success(toView(trustedDeviceRepository.save(device)), "Device approved"));
    }

    @PostMapping("/{id}/revoke")
    public ResponseEntity<ApiResponse<DeviceView>> revoke(@PathVariable UUID id) {
        requireAdmin();
        TrustedDevice device = trustedDeviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Device not found"));
        device.setStatus(DeviceStatus.REVOKED);
        return ResponseEntity.ok(ApiResponse.success(toView(trustedDeviceRepository.save(device)), "Device revoked"));
    }

    private User requireAdmin() {
        User user = accessScopeService.requireUser();
        if (!accessScopeService.isLeadership(user)) {
            throw new ForbiddenException("Only an admin or founder can manage devices");
        }
        return user;
    }

    private DeviceView toView(TrustedDevice device) {
        User owner = userRepository.findById(device.getUserId()).orElse(null);
        return new DeviceView(
                device.getId(),
                device.getUserId(),
                owner != null ? owner.getUsername() : "",
                owner != null ? owner.getDisplayName() : "",
                device.getDeviceId(),
                device.getLabel(),
                device.getStatus().name(),
                device.getFirstSeenAt(),
                device.getLastSeenAt()
        );
    }

    public record DeviceView(
            UUID id,
            UUID userId,
            String username,
            String displayName,
            String deviceId,
            String label,
            String status,
            Instant firstSeenAt,
            Instant lastSeenAt
    ) {}
}
