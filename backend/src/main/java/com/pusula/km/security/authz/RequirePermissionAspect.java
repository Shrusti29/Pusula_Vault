package com.pusula.km.security.authz;

import com.pusula.km.exception.PermissionDeniedException;
import com.pusula.km.service.authz.AuthorizationEngine;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.lang.reflect.Method;
import java.util.UUID;

@Aspect
@Component
@RequiredArgsConstructor
public class RequirePermissionAspect {

    private final AuthorizationEngine authorizationEngine;

    @Before("@annotation(RequirePermission) || @within(RequirePermission)")
    public void checkPermission(JoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        RequirePermission ann = method.getAnnotation(RequirePermission.class);
        if (ann == null) {
            ann = joinPoint.getTarget().getClass().getAnnotation(RequirePermission.class);
        }
        if (ann == null) return;

        UUID currentUserId = null;
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UUID) {
            currentUserId = (UUID) auth.getPrincipal();
        }

        String resourceId = null;
        Object[] args = joinPoint.getArgs();
        String paramName = ann.resourceIdParam();
        String[] paramNames = signature.getParameterNames();
        if (paramNames != null) {
            for (int i = 0; i < paramNames.length; i++) {
                if (paramNames[i].equals(paramName) && args[i] != null) {
                    resourceId = args[i].toString();
                    break;
                }
            }
        }
        if (resourceId == null && args.length > 0 && args[0] != null) {
            resourceId = args[0].toString();
        }

        boolean allowed = authorizationEngine.hasPermission(currentUserId, ann.resourceType(), resourceId, ann.permission());
        if (!allowed) {
            throw new PermissionDeniedException("Access Denied: Insufficient permissions for " + ann.resourceType() + ":" + ann.permission());
        }
    }
}
