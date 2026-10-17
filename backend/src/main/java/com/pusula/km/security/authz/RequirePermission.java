package com.pusula.km.security.authz;

import com.pusula.km.model.enums.Permission;
import com.pusula.km.model.enums.ResourceType;
import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
public @interface RequirePermission {
    ResourceType resourceType();
    Permission permission();
    String resourceIdParam() default "id";
}
