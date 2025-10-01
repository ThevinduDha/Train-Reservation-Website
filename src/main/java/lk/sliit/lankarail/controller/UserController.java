package lk.sliit.lankarail.controller;

import lk.sliit.lankarail.model.User;
import lk.sliit.lankarail.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * UserController - basic user management plus a /me endpoint for the logged-in user.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    // List all users (admin UI can call this; secure it on the backend)
    @GetMapping
    public ResponseEntity<List<User>> all() {
        List<User> users = service.findAll();
        // ensure we do not leak passwords
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    // Get one user by id
    @GetMapping("/{id}")
    public ResponseEntity<User> one(@PathVariable Long id) {
        User u = service.findById(id);
        u.setPassword(null);
        return ResponseEntity.ok(u);
    }

    // Update user
    @PutMapping("/{id}")
    public ResponseEntity<User> update(@PathVariable Long id, @RequestBody User user) {
        User updated = service.update(id, user);
        updated.setPassword(null);
        return ResponseEntity.ok(updated);
    }

    // Delete user
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Return the currently authenticated user's basic info.
     * The request must be authenticated (Security config controls that).
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        String email = authentication.getName();
        User u = service.findByEmail(email);
        if (u == null) {
            // fallback: return minimal info
            return ResponseEntity.ok().body(java.util.Map.of("email", email));
        }
        u.setPassword(null);
        return ResponseEntity.ok(u);
    }
}
