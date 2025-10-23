package lk.sliit.lankarail.impl;

import lk.sliit.lankarail.model.User;
import lk.sliit.lankarail.repository.UserRepository;
import lk.sliit.lankarail.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository repo;
    private final PasswordEncoder encoder;

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
            user.setRole("ROLE_MEMBER"); // default role
        } else if (!user.getRole().startsWith("ROLE_")) {
            user.setRole("ROLE_" + user.getRole().toUpperCase());
        }
        user.setEnabled(true);
        User saved = repo.save(user);
        saved.setPassword(null);
        return saved;
    }

    // ADD THIS NEW METHOD
    @Override
    public User createAdmin(User user) {
        if (user.getEmail() == null || user.getPassword() == null) {
            throw new IllegalArgumentException("Email and password are required for admin creation");
        }
        if (repo.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists: " + user.getEmail());
        }
        user.setPassword(encoder.encode(user.getPassword())); // Hash password
        user.setRole("ROLE_ADMIN"); // Explicitly set role
        user.setEnabled(true); // Ensure admin is enabled
        User saved = repo.save(user);
        saved.setPassword(null); // Don't return password hash
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

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            existing.setEmail(user.getEmail());
        }
        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            existing.setPassword(encoder.encode(user.getPassword()));
        }
        if (user.getRole() != null && !user.getRole().isBlank()) {
            String role = user.getRole();
            if (!role.startsWith("ROLE_")) {
                role = "ROLE_" + role.toUpperCase();
            }
            existing.setRole(role);
        }
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
        return repo.findByEmail(email).orElse(null);
    }
}