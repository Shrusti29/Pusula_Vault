package com.pusula.km.util.tracking;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class MdcFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestId = UUID.randomUUID().toString();
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String operation = method + uri;

        String userId = "anonymous";
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof String) {
                userId = (String) principal;
            } else if (principal != null) {
                userId = principal.toString();
            }
        }

        long startNanos = System.nanoTime();

        try {
            MDC.put("requestId", requestId);
            MDC.put("userId", userId);
            MDC.put("operation", operation);

            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            try {
                MDC.put("durationMs", String.valueOf(durationMs));
            } finally {
                MDC.clear();
            }
        }
    }
}
