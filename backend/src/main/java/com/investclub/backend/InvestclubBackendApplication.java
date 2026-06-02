package com.investclub.backend;

import java.util.Arrays;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import com.investclub.backend.web.UserRepository;
import com.investclub.backend.web.TradeRepository;
import com.investclub.backend.web.TradePlaceholderRequest;
import com.investclub.backend.web.TradeExitRequest;
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
    ApplicationRunner seedDemoUser(Environment environment, UserRepository userRepository, PasswordEncoder passwordEncoder, TradeRepository tradeRepository) {
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

                    // --- BEGIN DEMO TRADE SEED ---
                    var demoUser = userRepository.findByUsernameOrEmail(demoEmail);
                    if (demoUser != null) {
                        var existingTrades = tradeRepository.findAllByUserId(demoUser.id());
                        if (existingTrades == null || existingTrades.isEmpty()) {
                            // Trade 1: No exits
                            TradePlaceholderRequest t1 = new TradePlaceholderRequest();
                            t1.openedAt = java.time.OffsetDateTime.now().minusDays(10);
                            t1.ticker = "AAPL";
                            t1.side = "BUY";
                            t1.timeframe = "1d";
                            t1.strategy = "demo-strategy";
                            t1.currency = "USD";
                            t1.quantity = new java.math.BigDecimal("10");
                            t1.entryPrice = new java.math.BigDecimal("150.00");
                            t1.stopLoss = new java.math.BigDecimal("140.00");
                            t1.takeProfit = new java.math.BigDecimal("170.00");
                            t1.notes = "Demo trade 1";
                            t1.beThresholdPercent = new java.math.BigDecimal("1.0");
                            var trade1 = tradeRepository.createTrade(demoUser.id(), t1);

                            // Trade 2: With exit
                            TradePlaceholderRequest t2 = new TradePlaceholderRequest();
                            t2.openedAt = java.time.OffsetDateTime.now().minusDays(5);
                            t2.ticker = "TSLA";
                            t2.side = "SELL";
                            t2.timeframe = "4h";
                            t2.strategy = "demo-strategy";
                            t2.currency = "USD";
                            t2.quantity = new java.math.BigDecimal("5");
                            t2.entryPrice = new java.math.BigDecimal("700.00");
                            t2.stopLoss = new java.math.BigDecimal("750.00");
                            t2.takeProfit = new java.math.BigDecimal("650.00");
                            t2.notes = "Demo trade 2";
                            t2.beThresholdPercent = new java.math.BigDecimal("1.0");
                            var trade2 = tradeRepository.createTrade(demoUser.id(), t2);

                            TradeExitRequest exit = new TradeExitRequest();
                            exit.closedAt = java.time.OffsetDateTime.now().minusDays(2);
                            exit.quantity = new java.math.BigDecimal("5");
                            exit.exitPrice = new java.math.BigDecimal("680.00");
                            exit.notes = "Demo exit";
                            tradeRepository.addExit(trade2.id(), exit);

                            System.out.println("Seeded demo trades for demo user: " + demoEmail);
                        }
                    }
                    // --- END DEMO TRADE SEED ---
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
