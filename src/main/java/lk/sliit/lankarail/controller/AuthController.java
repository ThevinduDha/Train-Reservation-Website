package lk.sliit.lankarail.controller;

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
 * Simple, robust AuthController that exposes:
 *  - POST /api/auth/register
 *  - POST /api/auth/login
 *
 * Notes:
 *  - Login expects Content-Type: application/json and a JSON body matching LoginRequest.
 *  - This version uses AuthenticationManager to authenticate and JwtUtils to generate token.
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

    @PostMapping(path = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> register(@RequestBody User user) {
        User created = userService.register(user);
        created.setPassword(null);
        return ResponseEntity.ok(created);
    }

    @PostMapping(path = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
            );

            UserDetails principal = (UserDetails) authentication.getPrincipal();
            String token = jwtUtils.generateJwtToken(principal.getUsername());

            // get user entity for id and role (optional)
            // If you want id, you can fetch user by email here from repo via userService
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
