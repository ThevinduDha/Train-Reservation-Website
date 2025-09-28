package lk.sliit.lankarail.controller;

import jakarta.validation.Valid;
import lk.sliit.lankarail.model.User;
import lk.sliit.lankarail.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository,
                          AuthenticationManager authenticationManager,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Register new user — defaults to ROLE_MEMBER
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user) {
        if (user.getEmail() == null || user.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password required"));
        }

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("ROLE_MEMBER"); // default role
        }
        user.setEnabled(true);

        User created = userRepository.save(user);
        created.setPassword(null); // hide password
        return ResponseEntity.ok(created);
    }

    /**
     * Login — authenticates and starts session
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(body.get("email"), body.get("password"))
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // build simple response: token placeholder + role(s)
            List<String> roles = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            String primaryRole = roles.isEmpty() ? "ROLE_MEMBER" : roles.get(0);

            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Login successful");
            resp.put("email", body.get("email"));
            resp.put("roles", roles);
            resp.put("role", primaryRole);   // convenient single role for frontend
            resp.put("token", "");           // placeholder if you later add JWT

            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
    }

    /**
     * Logout is handled automatically by Spring at /api/auth/logout (if you wire it up)
     */
}
