package com.investclub.backend;

import java.util.Arrays;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import com.investclub.backend.web.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

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

    @Bean
    ApplicationRunner seedDemoUser(Environment environment, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return new ApplicationRunner() {
            @Override
            public void run(ApplicationArguments args) {
                String demoEmail = environment.getProperty("app.demo.email", "demo@investclub.dev");
                String demoUsername = environment.getProperty("app.demo.username", "demo");
                String demoPassword = environment.getProperty("app.demo.password", "Demo123");

                try {
                    if (!userRepository.existsByEmail(demoEmail) && !userRepository.existsByUsername(demoUsername)) {
                        String hash = passwordEncoder.encode(demoPassword);
                        userRepository.save(demoUsername, demoEmail, hash, null);
                        System.out.println("Created demo user: " + demoEmail + " (username: " + demoUsername + ")");
                    } else {
                        System.out.println("Demo user already exists or email/username taken: " + demoEmail);
                    }
                } catch (Exception ex) {
                    System.err.println("Failed to create demo user: " + ex.getMessage());
                }
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
