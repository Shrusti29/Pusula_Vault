package com.pusula.km.repository;

import com.pusula.km.model.entity.TrustedDevice;
import com.pusula.km.model.enums.DeviceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TrustedDeviceRepository extends JpaRepository<TrustedDevice, UUID> {
    Optional<TrustedDevice> findByUserIdAndDeviceId(UUID userId, String deviceId);
    List<TrustedDevice> findByStatusOrderByFirstSeenAtAsc(DeviceStatus status);
    List<TrustedDevice> findAllByOrderByFirstSeenAtDesc();
}
