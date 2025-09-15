package lk.sliit.lankarail.impl;

import lk.sliit.lankarail.model.User;
import lk.sliit.lankarail.repository.UserRepository;
import lk.sliit.lankarail.service.UserService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository repo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public UserServiceImpl(UserRepository repo) {
        this.repo = repo;
    }

    @Override
    public User register(User user) {
        if (user.getEmail() == null || user.getPassword() == null) {
            throw new IllegalArgumentException("Email and password are required");
        }
        if (repo.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        user.setPassword(encoder.encode(user.getPassword())); // hash password
        if (user.getRole() == null) user.setRole("ROLE_MEMBER"); // default role
        return repo.save(user);
    }

    @Override
    public List<User> findAll() {
        List<User> users = repo.findAll();
        // hide passwords before returning
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
        if (user.getEmail() != null) existing.setEmail(user.getEmail());
        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            existing.setPassword(encoder.encode(user.getPassword()));
        }
        if (user.getRole() != null) existing.setRole(user.getRole());
        existing.setEnabled(user.isEnabled());
        User saved = repo.save(existing);
        saved.setPassword(null);
        return saved;
    }

    @Override
    public void delete(Long id) {
        repo.deleteById(id);
    }

    @Override
    public User findByEmail(String email) {
        return repo.findByEmail(email).orElse(null);
    }
}
