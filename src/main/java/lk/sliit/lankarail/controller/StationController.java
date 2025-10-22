package lk.sliit.lankarail.controller;

import jakarta.validation.Valid;
import lk.sliit.lankarail.model.Station;
import lk.sliit.lankarail.service.StationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api") // Changed to /api
public class StationController {

    private final StationService service;

    public StationController(StationService service) {
        this.service = service;
    }

    // --- PUBLIC Endpoint ---
    @GetMapping("/stations") // NEW: Public endpoint for passengers
    public ResponseEntity<List<Station>> publicFindAll() {
        return ResponseEntity.ok(service.findAll());
    }


    // --- ADMIN Endpoints ---
    @PostMapping("/admin/stations")
    public ResponseEntity<Station> create(@Valid @RequestBody Station station) {
        return ResponseEntity.ok(service.create(station));
    }

    @GetMapping("/admin/stations")
    public ResponseEntity<List<Station>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/admin/stations/{id}")
    public ResponseEntity<Station> one(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/admin/stations/{id}")
    public ResponseEntity<Station> update(@PathVariable Long id, @Valid @RequestBody Station station) {
        return ResponseEntity.ok(service.update(id, station));
    }

    @DeleteMapping("/admin/stations/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
