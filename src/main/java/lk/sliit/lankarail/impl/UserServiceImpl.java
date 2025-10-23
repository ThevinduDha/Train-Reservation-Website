package lk.sliit.lankarail.impl;

import lk.sliit.lankarail.model.User;
import lk.sliit.lankarail.repository.UserRepository;
import lk.sliit.lankarail.service.UserService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder; // Ensure PasswordEncoder is imported
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository repo;
    // Use PasswordEncoder interface for flexibility
    private final PasswordEncoder encoder;

    // Inject PasswordEncoder
    public UserServiceImpl(UserRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    @Override
    public User register(User user) {
        if (user.getEmail() == null || user.getPassword() == null) {
            throw new IllegalArgumentException("Email and password are required");
        }
        if (repo.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists: " + user.getEmail());
        }
        user.setPassword(encoder.encode(user.getPassword())); // hash password
        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("ROLE_MEMBER"); // default role if blank or null
        } else if (!user.getRole().startsWith("ROLE_")) {
            // Optionally enforce ROLE_ prefix if needed by Spring Security
            user.setRole("ROLE_" + user.getRole().toUpperCase());
        }
        user.setEnabled(true); // Ensure user is enabled by default
        User saved = repo.save(user);
        saved.setPassword(null);
        return saved;
    }


    @Override
    public List<User> findAll() {
        List<User> users = repo.findAll();
        users.forEach(u -> u.setPassword(null));
        return users;
    }

    @Override
    public User findById(Long id) {
        User u = repo.findById(id).orElseThrow(() -> new RuntimeException("User not found: " + id));
        u.setPassword(null);
        return u;
    }

    @Override
    public User update(Long id, User user) {
        User existing = repo.findById(id).orElseThrow(() -> new RuntimeException("User not found: " + id));

        // Only update fields that are provided in the request
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            // Optional: Add check if new email already exists if changing email is allowed
            existing.setEmail(user.getEmail());
        }
        // Only hash and update password if a new one is provided
        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            existing.setPassword(encoder.encode(user.getPassword()));
        }
        if (user.getRole() != null && !user.getRole().isBlank()) {
            // Optional: Enforce ROLE_ prefix
            String role = user.getRole();
            if (!role.startsWith("ROLE_")) {
                role = "ROLE_" + role.toUpperCase();
            }
            existing.setRole(role);
        }
        // Always allow updating the enabled status
        existing.setEnabled(user.isEnabled());

        User saved = repo.save(existing);
        saved.setPassword(null);
        return saved;
    }


    @Override
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new RuntimeException("User not found: " + id);
        }
        repo.deleteById(id);
    }

    @Override
    public User findByEmail(String email) {
        // Return null if not found, don't throw exception here
        return repo.findByEmail(email).orElse(null);
    }
}