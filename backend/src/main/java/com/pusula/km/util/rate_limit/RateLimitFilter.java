package com.pusula.km.util.rate_limit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int DEFAULT_CAPACITY = 60;
    private static final long DEFAULT_WINDOW_SECONDS = 60;

    private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = getClientIp(request);
        String uri = request.getRequestURI();
        String key = clientIp + ":" + uri;

        Bucket bucket = buckets.computeIfAbsent(key, k -> new Bucket(DEFAULT_CAPACITY, DEFAULT_WINDOW_SECONDS));

        long remaining;
        boolean allow;
        synchronized (bucket) {
            bucket.refillIfNeeded();
            if (bucket.tokens > 0) {
                bucket.tokens -= 1;
                remaining = bucket.tokens;
                allow = true;
            } else {
                remaining = 0;
                allow = false;
            }
        }

        response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));

        if (allow) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.getWriter().write("429 Too Many Requests");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isEmpty()) {
            return xf.split(",")[0].trim();
        }
        String remote = request.getRemoteAddr();
        return remote != null ? remote : "unknown";
    }

    private static class Bucket {
        final int capacity;
        final long windowSeconds;
        long tokens;
        long lastRefillEpochSeconds;

        Bucket(int capacity, long windowSeconds) {
            this.capacity = capacity;
            this.windowSeconds = windowSeconds;
            this.tokens = capacity;
            this.lastRefillEpochSeconds = TimeUnit.MILLISECONDS.toSeconds(System.currentTimeMillis());
        }

        void refillIfNeeded() {
            long now = TimeUnit.MILLISECONDS.toSeconds(System.currentTimeMillis());
            if (now - lastRefillEpochSeconds >= windowSeconds) {
                tokens = capacity;
                lastRefillEpochSeconds = now;
            }
        }
    }
}
