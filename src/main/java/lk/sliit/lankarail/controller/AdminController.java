package lk.sliit.lankarail.controller;

import lk.sliit.lankarail.model.User;
import lk.sliit.lankarail.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Admin creates new user (either member or admin)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users")
    public Object createUser(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String role = body.getOrDefault("role", "ROLE_MEMBER");

        if (email == null || password == null) {
            return Map.of("error", "Email and password are required");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            return Map.of("error", "Email already exists");
        }

        User u = new User();
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(password));
        u.setRole(role);
        u.setEnabled(true);

        userRepository.save(u);
        u.setPassword(null);
        return u;
    }
}
