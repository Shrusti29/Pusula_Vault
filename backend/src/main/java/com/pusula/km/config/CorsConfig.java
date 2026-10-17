package com.pusula.km.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final CorsProperties corsProperties;

    public CorsConfig(CorsProperties corsProperties) {
        this.corsProperties = corsProperties;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> origins = corsProperties.allowedOrigins();
        if (origins == null || origins.isEmpty()) {
            return;
        }
        registry.addMapping("/**")
                .allowedOrigins(origins.toArray(new String[0]))
                .allowCredentials(true)
                .allowedMethods("*")
                .allowedHeaders("*");
    }

    @Bean
    public ApplicationRunner corsProdWildcardCheckRunner(Environment environment, CorsProperties corsProperties) {
        return new ApplicationRunner() {
            @Override
            public void run(ApplicationArguments args) {
                boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");
                if (!isProd) {
                    return;
                }
                List<String> origins = corsProperties.allowedOrigins();
                if (origins != null) {
                    for (String origin : origins) {
                        if ("*".equals(origin)) {
                            throw new IllegalStateException("Wildcard CORS origin '*' is not allowed in production profile.");
                        }
                    }
                }
            }
        };
    }
}
