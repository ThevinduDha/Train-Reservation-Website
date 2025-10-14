package lk.sliit.lankarail.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    // Serves the main login/signup page (or a future homepage)
    @GetMapping("/")
    public String index() {
        return "login"; // Renders login.html
    }

    @GetMapping("/login")
    public String loginPage() {
        return "login"; // Renders login.html
    }

    @GetMapping("/signup")
    public String signupPage() {
        return "signup"; // Renders signup.html
    }

    @GetMapping("/admin")
    public String adminLoginPage() {
        return "admin"; // Renders admin.html
    }


    @GetMapping("/admin/dashboard")
    public String adminDashboardPage() {
        return "admin-dashboard"; // Renders admin-dashboard.html
    }


    @GetMapping("/passenger/dashboard")
    public String passengerDashboardPage() {
        return "passenger-dashboard"; // Renders passenger-dashboard.html
    }

    // Note: We don't need mappings for admin-dashboard or passenger-dashboard here.
    // Spring Security will handle redirecting to them after a successful login.
    // However, if you add direct links to them, you would add them here.
}