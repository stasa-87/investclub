package com.investclub.backend.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SwaggerRedirectController {

    @GetMapping("/swagger")
    public String redirectToSwaggerUI() {
        return "redirect:/swagger-ui/index.html";
    }
}
