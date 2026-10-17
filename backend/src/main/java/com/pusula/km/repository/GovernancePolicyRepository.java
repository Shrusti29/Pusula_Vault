package com.pusula.km.repository;

import com.pusula.km.model.entity.GovernancePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GovernancePolicyRepository extends JpaRepository<GovernancePolicy, UUID> {
    Optional<GovernancePolicy> findByName(String name);
}
