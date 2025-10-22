package lk.sliit.lankarail.controller;

import jakarta.validation.Valid;
import lk.sliit.lankarail.model.Booking;
import lk.sliit.lankarail.model.User;
import lk.sliit.lankarail.service.BookingService;
import lk.sliit.lankarail.service.UserService; // IMPORT THIS
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication; // IMPORT THIS
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException; // IMPORT THIS
import java.util.List;

@RestController
@RequestMapping("/api")
public class BookingController {

    private final BookingService service;
    private final UserService userService; // ADD THIS

    public BookingController(BookingService service, UserService userService) { // UPDATE CONSTRUCTOR
        this.service = service;
        this.userService = userService; // ADD THIS
    }

    // --- PASSENGER Endpoints ---

    @PostMapping("/bookings")
    public ResponseEntity<Booking> create(@Valid @RequestBody Booking booking) {
        return ResponseEntity.ok(service.create(booking));
    }

    // NEW ENDPOINT FOR "MY BOOKINGS"
    @GetMapping("/bookings/my-bookings")
    public ResponseEntity<List<Booking>> getMyBookings(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        String email = authentication.getName();
        User user = userService.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(404).body(null);
        }
        return ResponseEntity.ok(service.findByUserId(user.getId()));
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<Booking> one(@PathVariable Long id, Authentication authentication) throws AccessDeniedException {
        // Security Check: Make sure the logged-in user owns this booking
        String email = authentication.getName();
        User user = userService.findByEmail(email);
        Booking booking = service.findById(id);

        if (!booking.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("You do not own this booking.");
        }
        return ResponseEntity.ok(booking);
    }

    // ... (rest of your PUT, DELETE, POST /pay endpoints) ...
    // ... (You should add the same security check to PUT and DELETE) ...


    // --- ADMIN Endpoints ---

    @GetMapping("/admin/bookings")
    public ResponseEntity<List<Booking>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    @DeleteMapping("/admin/bookings/{id}")
    public ResponseEntity<?> adminDeleteBooking(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/admin/bookings/{id}/confirm-payment")
    public ResponseEntity<Booking> confirmPayment(@PathVariable Long id) {
        return ResponseEntity.ok(service.confirmPayment(id, "AdminUser"));
    }

    @PutMapping("/admin/bookings/{id}/reject-payment")
    public ResponseEntity<Booking> rejectPayment(@PathVariable Long id) {
        return ResponseEntity.ok(service.rejectPayment(id, "AdminUser"));
    }
}