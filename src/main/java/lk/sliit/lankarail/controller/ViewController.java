package lk.sliit.lankarail.controller;

import lk.sliit.lankarail.model.Booking;
import lk.sliit.lankarail.service.BookingService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class ViewController {

    // ADD THIS FIELD
    private final BookingService bookingService;

    // UPDATE THE CONSTRUCTOR TO ACCEPT BookingService
    public ViewController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

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

    // THE METHOD WE ADDED IN THE LAST STEP
    @GetMapping("/ticket")
    public String ticketPage(@RequestParam Long id, Model model) {
        try {
            // This now works because bookingService is available
            Booking booking = bookingService.findById(id);
            model.addAttribute("booking", booking);
            return "ticket"; // This will render ticket.html
        } catch (Exception e) {
            return "redirect:/passenger/dashboard";
        }
    }
}