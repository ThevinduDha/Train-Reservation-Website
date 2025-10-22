package lk.sliit.lankarail.controller;

import jakarta.validation.Valid;
import lk.sliit.lankarail.model.Schedule;
import lk.sliit.lankarail.service.ScheduleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api") // Changed to /api
public class ScheduleController {

    private final ScheduleService service;

    public ScheduleController(ScheduleService service) {
        this.service = service;
    }

    // --- PUBLIC Endpoint for Passengers ---

    @GetMapping("/schedules") // NEW: This is the public endpoint for passengers
    public ResponseEntity<List<Schedule>> getAvailableSchedules() {
        return ResponseEntity.ok(service.findAll());
    }

    // --- ADMIN Endpoints ---

    @PostMapping("/admin/schedules")
    public ResponseEntity<Schedule> create(@Valid @RequestBody Schedule schedule) {
        return ResponseEntity.ok(service.create(schedule));
    }

    @GetMapping("/admin/schedules") // This remains for admin management
    public ResponseEntity<List<Schedule>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/admin/schedules/{id}")
    public ResponseEntity<Schedule> one(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/admin/schedules/{id}")
    public ResponseEntity<Schedule> update(@PathVariable Long id, @Valid @RequestBody Schedule schedule) {
        return ResponseEntity.ok(service.update(id, schedule));
    }

    @DeleteMapping("/admin/schedules/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}