package com.example.attendance.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class LoginController {
    @GetMapping("/login")
    public String showLoginForm() {
        return "login";
    }
    @PostMapping("/login")
public String processLogin(@RequestParam String username,
                           @RequestParam String password,
                           jakarta.servlet.http.HttpSession session,
                           org.springframework.ui.Model model) {
    if ("Riyaz".equals(username) && "pass123".equals(password)) {
        session.setAttribute("user", username);
        return "redirect:/index";
    } else {
        model.addAttribute("error", "Invalid credentials");
        return "login";
    }
}
}
