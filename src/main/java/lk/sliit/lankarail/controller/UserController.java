package lk.sliit.lankarail.controller;

import jakarta.validation.Valid;
import lk.sliit.lankarail.model.User;
import lk.sliit.lankarail.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    // List all users
    @GetMapping
    public ResponseEntity<List<User>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    // Get one user
    @GetMapping("/{id}")
    public ResponseEntity<User> one(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    // Update user
    @PutMapping("/{id}")
    public ResponseEntity<User> update(@PathVariable Long id, @Valid @RequestBody User user) {
        return ResponseEntity.ok(service.update(id, user));
    }

    // Delete user
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
