package lk.sliit.lankarail.controller;

import jakarta.validation.Valid;
import lk.sliit.lankarail.model.Schedule;
import lk.sliit.lankarail.service.ScheduleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    private final ScheduleService service;

    public ScheduleController(ScheduleService service) {
        this.service = service;
    }

    // Create
    @PostMapping
    public ResponseEntity<Schedule> create(@Valid @RequestBody Schedule schedule) {
        return ResponseEntity.ok(service.create(schedule));
    }

    // Read all
    @GetMapping
    public ResponseEntity<List<Schedule>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    // Read one
    @GetMapping("/{id}")
    public ResponseEntity<Schedule> one(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    // Update
    @PutMapping("/{id}")
    public ResponseEntity<Schedule> update(@PathVariable Long id, @Valid @RequestBody Schedule schedule) {
        return ResponseEntity.ok(service.update(id, schedule));
    }

    // Delete
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
