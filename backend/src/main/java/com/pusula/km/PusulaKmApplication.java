package com.pusula.km;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan(basePackages = "com.pusula.km.config")
public class PusulaKmApplication {

    public static void main(String[] args) {
        SpringApplication.run(PusulaKmApplication.class, args);
    }

}
