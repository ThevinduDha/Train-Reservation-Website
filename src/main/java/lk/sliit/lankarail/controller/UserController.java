package lk.sliit.lankarail.controller;

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

    // GET /api/users
    @GetMapping
    public ResponseEntity<List<User>> all() {
        return ResponseEntity.ok(service.findAll());
    }

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<User> one(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    // PUT /api/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<User> update(@PathVariable Long id, @RequestBody User user) {
        return ResponseEntity.ok(service.update(id, user));
    }

    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
