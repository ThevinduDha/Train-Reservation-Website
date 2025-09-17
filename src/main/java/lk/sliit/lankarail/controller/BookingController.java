package lk.sliit.lankarail.controller;

import jakarta.validation.Valid;
import lk.sliit.lankarail.model.Booking;
import lk.sliit.lankarail.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService service;

    public BookingController(BookingService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Booking> create(@Valid @RequestBody Booking booking) {
        return ResponseEntity.ok(service.create(booking));
    }

    @GetMapping
    public ResponseEntity<List<Booking>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> one(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Booking> update(@PathVariable Long id, @RequestBody Booking booking) {
        return ResponseEntity.ok(service.update(id, booking));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
