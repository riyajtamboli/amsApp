package com.example.attendance.controller; // Replace with your actual package

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/")
    public String home() {
        return "✅ Spring Boot app is running on Railway!";
    }
}