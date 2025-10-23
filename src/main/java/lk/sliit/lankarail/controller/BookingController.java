package lk.sliit.lankarail.controller;

import jakarta.validation.Valid;
import lk.sliit.lankarail.model.Booking;
import lk.sliit.lankarail.model.User;
import lk.sliit.lankarail.service.BookingService;
import lk.sliit.lankarail.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.AccessDeniedException; // Make sure this is imported

import java.util.List;

@RestController
@RequestMapping("/api")
public class BookingController {

    private final BookingService service;
    private final UserService userService;

    public BookingController(BookingService service, UserService userService) {
        this.service = service;
        this.userService = userService;
    }

    // --- PASSENGER Endpoints ---

    @PostMapping("/bookings")
    public ResponseEntity<Booking> create(@Valid @RequestBody Booking booking, Authentication authentication) throws AccessDeniedException {
        // Security: Ensure the booking userId matches the logged-in user
        String email = authentication.getName();
        User user = userService.findByEmail(email);
        if (!booking.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("Cannot create booking for another user.");
        }
        return ResponseEntity.ok(service.create(booking));
    }

    @GetMapping("/bookings/my-bookings")
    public ResponseEntity<List<Booking>> getMyBookings(Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        User user = userService.findByEmail(authentication.getName());
        if (user == null) return ResponseEntity.status(404).build();
        return ResponseEntity.ok(service.findByUserId(user.getId()));
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<Booking> one(@PathVariable Long id, Authentication authentication) throws AccessDeniedException {
        String email = authentication.getName();
        User user = userService.findByEmail(email);
        Booking booking = service.findById(id);
        if (!booking.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("You do not own this booking.");
        }
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/bookings/{id}")
    public ResponseEntity<Booking> update(@PathVariable Long id, @RequestBody Booking booking, Authentication authentication) throws AccessDeniedException {
        String email = authentication.getName();
        User user = userService.findByEmail(email);
        Booking existingBooking = service.findById(id); // Check exists first
        if (!existingBooking.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("You do not own this booking.");
        }
        // Ensure user cannot change userId or scheduleId via update
        booking.setUserId(user.getId());
        booking.setScheduleId(existingBooking.getScheduleId());
        return ResponseEntity.ok(service.update(id, booking));
    }

    // *** ADDED MISSING DELETE MAPPING FOR PASSENGERS ***
    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication authentication) throws AccessDeniedException {
        String email = authentication.getName();
        User user = userService.findByEmail(email);
        Booking booking = service.findById(id);
        if (!booking.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("You do not own this booking to cancel it.");
        }
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/bookings/{id}/pay")
    public ResponseEntity<Booking> pay(@PathVariable Long id, Authentication authentication) throws AccessDeniedException {
        String email = authentication.getName();
        User user = userService.findByEmail(email);
        Booking booking = service.findById(id);
        if (!booking.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("You do not own this booking.");
        }
        return ResponseEntity.ok(service.markAsPaid(id));
    }

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
        // In real app, get admin user from Authentication object
        return ResponseEntity.ok(service.confirmPayment(id, "AdminUser"));
    }

    @PutMapping("/admin/bookings/{id}/reject-payment")
    public ResponseEntity<Booking> rejectPayment(@PathVariable Long id) {
        // In real app, get admin user from Authentication object
        return ResponseEntity.ok(service.rejectPayment(id, "AdminUser"));
    }
}