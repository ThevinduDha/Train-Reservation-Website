package lk.sliit.lankarail.controller;

import jakarta.validation.Valid;
import lk.sliit.lankarail.model.Booking;
import lk.sliit.lankarail.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api") // Changed to /api
public class BookingController {

    private final BookingService service;

    public BookingController(BookingService service) {
        this.service = service;
    }

    // --- PASSENGER Endpoints ---

    @PostMapping("/bookings") // This is for passengers to create a booking
    public ResponseEntity<Booking> create(@Valid @RequestBody Booking booking) {
        return ResponseEntity.ok(service.create(booking));
    }

    @GetMapping("/bookings/{id}") // This is for a passenger to view their own booking
    public ResponseEntity<Booking> one(@PathVariable Long id) {
        // Add security check here later to ensure user owns this booking
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/bookings/{id}") // For a passenger to update (e.g., change seats)
    public ResponseEntity<Booking> update(@PathVariable Long id, @RequestBody Booking booking) {
        // Add security check here later
        return ResponseEntity.ok(service.update(id, booking));
    }

    @DeleteMapping("/bookings/{id}") // For a passenger to cancel
    public ResponseEntity<?> delete(@PathVariable Long id) {
        // Add security check here later
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bookings/{id}/pay") // For a passenger to mark as "payment sent"
    public ResponseEntity<Booking> pay(@PathVariable Long id) {
        // Add security check here later
        return ResponseEntity.ok(service.markAsPaid(id));
    }

    // --- ADMIN Endpoints ---

    @GetMapping("/admin/bookings") // This is for admins to view ALL bookings
    public ResponseEntity<List<Booking>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    @PutMapping("/admin/bookings/{id}/confirm-payment") // For admin to CONFIRM payment
    public ResponseEntity<Booking> confirmPayment(@PathVariable Long id) {
        // later: get admin name from logged-in user
        return ResponseEntity.ok(service.confirmPayment(id, "AdminUser"));
    }

    @PutMapping("/admin/bookings/{id}/reject-payment") // For admin to REJECT payment
    public ResponseEntity<Booking> rejectPayment(@PathVariable Long id) {
        return ResponseEntity.ok(service.rejectPayment(id, "AdminUser"));
    }
}
