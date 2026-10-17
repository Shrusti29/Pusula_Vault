package com.pusula.km.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "pv.cors")
public record CorsProperties(List<String> allowedOrigins) {
}
