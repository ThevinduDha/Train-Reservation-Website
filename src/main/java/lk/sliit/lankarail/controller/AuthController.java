package lk.sliit.lankarail.controller;

import jakarta.validation.Valid;
import lk.sliit.lankarail.model.User;
import lk.sliit.lankarail.payload.JwtResponse;
import lk.sliit.lankarail.payload.LoginRequest;
import lk.sliit.lankarail.security.JwtUtils;
import lk.sliit.lankarail.service.UserService;
import lk.sliit.lankarail.impl.UserDetailsServiceImpl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController:
 * - POST /api/auth/register    -> register new user (validates input via @Valid)
 * - POST /api/auth/login       -> authenticate and (optionally) return a token
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserDetailsServiceImpl userDetailsService;

    public AuthController(UserService userService,
                          AuthenticationManager authenticationManager,
                          JwtUtils jwtUtils,
                          UserDetailsServiceImpl userDetailsService) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Register new user.
     * @param user incoming JSON mapped to User entity — validated because of @Valid
     */
    @PostMapping(path = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> register(@Valid @RequestBody User user) {
        User created = userService.register(user);
        // don't return password
        created.setPassword(null);
        return ResponseEntity.ok(created);
    }

    /**
     * Login — expects JSON with { "email": "...", "password": "..." }.
     * Uses AuthenticationManager to authenticate and JwtUtils to generate a token (if enabled).
     */
    @PostMapping(path = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
            );

            UserDetails principal = (UserDetails) authentication.getPrincipal();
            String token = jwtUtils.generateJwtToken(principal.getUsername());

            // Return token + role info (id omitted here — fetch from repo if you want)
            return ResponseEntity.ok(new JwtResponse(token, null, principal.getUsername(),
                    principal.getAuthorities().stream().findFirst().map(Object::toString).orElse("ROLE_MEMBER")));
        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(401).body("Invalid credentials");
        } catch (DisabledException ex) {
            return ResponseEntity.status(403).body("User disabled");
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Login error: " + ex.getMessage());
        }
    }
}
