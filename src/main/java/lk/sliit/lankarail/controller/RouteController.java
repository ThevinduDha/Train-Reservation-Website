package lk.sliit.lankarail.controller;

import jakarta.validation.Valid;
import lk.sliit.lankarail.model.Route;
import lk.sliit.lankarail.service.RouteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RouteService service;

    public RouteController(RouteService service) {
        this.service = service;
    }

    @PostMapping
    // @PreAuthorize("hasRole('ADMIN')") // uncomment when enabling role-based security
    public ResponseEntity<Route> create(@Valid @RequestBody Route route) {
        return ResponseEntity.ok(service.create(route));
    }

    @GetMapping
    public ResponseEntity<List<Route>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Route> one(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    // NOTE: removed @Valid here so PUT can accept partial updates.
    // Validation for provided fields is handled inside the service update(...) method.
    @PutMapping("/{id}")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Route> update(@PathVariable Long id, @RequestBody Route route) {
        return ResponseEntity.ok(service.update(id, route));
    }

    @DeleteMapping("/{id}")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

