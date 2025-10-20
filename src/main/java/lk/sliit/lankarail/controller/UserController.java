package lk.sliit.lankarail.controller;

import lk.sliit.lankarail.model.User;
import lk.sliit.lankarail.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * UserController - Manages user-related endpoints.
 * Admin functions are grouped under /api/admin/users
 * General user functions (like /me) are under /api/users
 */
@RestController
@RequestMapping("/api") // Changed to /api
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    // List all users (ADMIN ONLY)
    @GetMapping("/admin/users") // Changed to /admin/users
    public ResponseEntity<List<User>> all() {
        List<User> users = service.findAll();
        // ensure we do not leak passwords
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    // Get one user by id (ADMIN ONLY)
    @GetMapping("/admin/users/{id}") // Changed to /admin/users/{id}
    public ResponseEntity<User> one(@PathVariable Long id) {
        User u = service.findById(id);
        u.setPassword(null);
        return ResponseEntity.ok(u);
    }

    // Update user (ADMIN ONLY)
    @PutMapping("/admin/users/{id}") // Changed to /admin/users/{id}
    public ResponseEntity<User> update(@PathVariable Long id, @RequestBody User user) {
        User updated = service.update(id, user);
        updated.setPassword(null);
        return ResponseEntity.ok(updated);
    }

    // Delete user (ADMIN ONLY)
    @DeleteMapping("/admin/users/{id}") // Changed to /admin/users/{id}
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Return the currently authenticated user's basic info.
     * This path remains /api/users/me and is protected by SecurityConfig
     */
    @GetMapping("/users/me") // Changed to /users/me
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