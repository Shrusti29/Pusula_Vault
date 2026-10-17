package com.pusula.km.security;

import com.pusula.km.model.enums.AuditAction;
import com.pusula.km.service.impl.AuditService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@RequiredArgsConstructor
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private final AuditService auditService;
    private final ConcurrentHashMap<String, AttemptCounter> attemptsMap = new ConcurrentHashMap<>();

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 60000; // 1 minute

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if ("/api/v1/auth/login".equals(request.getRequestURI()) && "POST".equalsIgnoreCase(request.getMethod())) {
            String clientIp = request.getRemoteAddr();
            long now = System.currentTimeMillis();

            AttemptCounter counter = attemptsMap.compute(clientIp, (ip, existing) -> {
                if (existing == null || now - existing.windowStart > WINDOW_MS) {
                    return new AttemptCounter(now, new AtomicInteger(1));
                }
                existing.count.incrementAndGet();
                return existing;
            });

            if (counter.count.get() > MAX_ATTEMPTS) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"message\":\"Rate limit exceeded: too many login attempts. Please try again later.\",\"data\":null}");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    private static class AttemptCounter {
        long windowStart;
        AtomicInteger count;

        AttemptCounter(long windowStart, AtomicInteger count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
