package com.pusula.km.model.entity;

import com.pusula.km.model.enums.DeviceStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "pv_trusted_device", uniqueConstraints = {
        @UniqueConstraint(name = "uk_device_user", columnNames = {"user_id", "device_id"})
})
public class TrustedDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "device_id", nullable = false, length = 128)
    private String deviceId;

    @Column(length = 160)
    private String label;

    @Column(length = 400)
    private String userAgent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceStatus status;

    private Instant firstSeenAt;
    private Instant lastSeenAt;
    private UUID approvedBy;
    private Instant approvedAt;
}
