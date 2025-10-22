package lk.sliit.lankarail.controller;

import jakarta.validation.Valid;
import lk.sliit.lankarail.model.Train;
import lk.sliit.lankarail.service.TrainService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api") // Changed base mapping to /api
public class TrainController {

    private final TrainService service;

    public TrainController(TrainService service) {
        this.service = service;
    }

    // --- PUBLIC Endpoint for Passengers ---
    @GetMapping("/trains") // NEW: Public endpoint to get all trains
    public ResponseEntity<List<Train>> getAllTrainsPublic() {
        // You might want to create a DTO later to only send necessary info (id, name)
        return ResponseEntity.ok(service.findAll());
    }

    // --- ADMIN Endpoints ---
    @PostMapping("/admin/trains")
    public ResponseEntity<Train> create(@Valid @RequestBody Train train) {
        return ResponseEntity.ok(service.create(train));
    }

    @GetMapping("/admin/trains") // Keep admin endpoint for consistency if needed elsewhere
    public ResponseEntity<List<Train>> allAdmin() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/admin/trains/{id}")
    public ResponseEntity<Train> one(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/admin/trains/{id}")
    public ResponseEntity<Train> update(@PathVariable Long id, @Valid @RequestBody Train train) {
        return ResponseEntity.ok(service.update(id, train));
    }

    @DeleteMapping("/admin/trains/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}