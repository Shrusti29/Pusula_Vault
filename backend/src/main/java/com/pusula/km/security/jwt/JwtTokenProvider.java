package com.pusula.km.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.io.Decoders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private final Key key;
    private final long validityInMilliseconds = 3600000; // 1 hour

    public JwtTokenProvider(@Value("${pv.security.jwt-secret:}") String encodedSecret) {
        if (encodedSecret == null || encodedSecret.isBlank()) {
            // Generate a random 256-bit secret and encode it as Base64
            // This ensures the application can start locally without requiring manual secret configuration.
            // The secret is not persisted; it will be regenerated on each application start.
            java.security.Key generatedKey = io.jsonwebtoken.security.Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS256);
            encodedSecret = java.util.Base64.getEncoder().encodeToString(generatedKey.getEncoded());
        }
        try {
            this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(encodedSecret.trim()));
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("PV_JWT_SECRET must be valid base64 and at least 256 bits", ex);
        }
    }

    public String createToken(UUID userId, String username, String role) {
        return createToken(userId, username, role, "full", validityInMilliseconds);
    }

    public String createPendingToken(UUID userId, String username, String role) {
        return createToken(userId, username, role, "device-pending", 2 * 60 * 60 * 1000L);
    }

    private String createToken(UUID userId, String username, String role, String scope, long ttl) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + ttl);

        return Jwts.builder()
                .setSubject(username)
                .claim("userId", userId.toString())
                .claim("role", role)
                .claim("scope", scope)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(key)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }
}
