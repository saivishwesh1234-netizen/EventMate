package com.eventmate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class EventMateApplication {

    public static void main(String[] args) {
        SpringApplication.run(EventMateApplication.class, args);
        System.out.println("=================================================");
        System.out.println("🚀 Event Mate Spring Boot Backend running on port 8080");
        System.out.println("👉 API docs / endpoints available at http://localhost:8080/api/health");
        System.out.println("=================================================");
    }
}
