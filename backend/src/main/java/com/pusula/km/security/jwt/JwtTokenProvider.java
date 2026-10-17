package com.pusula.km.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    private final long validityInMilliseconds = 3600000; // 1 hour

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
