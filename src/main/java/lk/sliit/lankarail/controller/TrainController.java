package lk.sliit.lankarail.controller;

import lk.sliit.lankarail.model.Train;
import lk.sliit.lankarail.service.TrainService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trains")
public class TrainController {

    private final TrainService service;

    public TrainController(TrainService service) {
        this.service = service;
    }

    // Create
    @PostMapping
    public ResponseEntity<Train> create(@RequestBody Train train) {
        return ResponseEntity.ok(service.create(train));
    }

    // Read all
    @GetMapping
    public ResponseEntity<List<Train>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    // Read one
    @GetMapping("/{id}")
    public ResponseEntity<Train> one(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    // Update
    @PutMapping("/{id}")
    public ResponseEntity<Train> update(@PathVariable Long id, @RequestBody Train train) {
        return ResponseEntity.ok(service.update(id, train));
    }

    // Delete
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
