package com.pusula.km.repository;

import com.pusula.km.model.entity.RetentionRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RetentionRuleRepository extends JpaRepository<RetentionRule, UUID> {
    Optional<RetentionRule> findByName(String name);
}
