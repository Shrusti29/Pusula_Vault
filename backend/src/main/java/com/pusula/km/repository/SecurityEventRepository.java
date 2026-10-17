package com.pusula.km.repository;

import com.pusula.km.model.entity.SecurityEvent;
import com.pusula.km.model.enums.SecurityEventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.Instant;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {
    Page<SecurityEvent> findByEventType(SecurityEventType eventType, Pageable pageable);
    Page<SecurityEvent> findByDetectedAtBetween(Instant start, Instant end, Pageable pageable);
}
