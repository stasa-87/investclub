package com.investclub.backend;

import java.util.Arrays;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class InvestclubBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(InvestclubBackendApplication.class, args);
    }

    @Bean
    ApplicationRunner logProjectEndpoints(Environment environment) {
        return new ApplicationRunner() {
            @Override
            public void run(ApplicationArguments args) {
                String serverPort = environment.getProperty("local.server.port", environment.getProperty("server.port", "8080"));
                String frontendUrl = firstValue(environment.getProperty("app.cors.allowed-origins"), "http://localhost:5173");
                String backendUrl = "http://localhost:" + serverPort;

                System.out.println("Project endpoints:");
                System.out.println("- Frontend: " + frontendUrl);
                System.out.println("- Backend: " + backendUrl);
            }
        };
    }

    private static String firstValue(String values, String fallback) {
        if (values == null || values.isBlank()) {
            return fallback;
        }

        return Arrays.stream(values.split(","))
            .map(String::trim)
            .filter(value -> !value.isEmpty())
            .findFirst()
            .orElse(fallback);
    }
}
