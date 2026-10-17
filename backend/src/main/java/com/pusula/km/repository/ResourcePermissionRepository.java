package com.pusula.km.repository;

import com.pusula.km.model.entity.ResourcePermission;
import com.pusula.km.model.enums.GranteeType;
import com.pusula.km.model.enums.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ResourcePermissionRepository extends JpaRepository<ResourcePermission, Long> {
    List<ResourcePermission> findByResourceTypeAndResourceId(ResourceType resourceType, String resourceId);
    List<ResourcePermission> findByGranteeTypeAndGranteeId(GranteeType granteeType, String granteeId);
}
