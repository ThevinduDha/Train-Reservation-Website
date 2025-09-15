package lk.sliit.lankarail.service;

import lk.sliit.lankarail.model.User;

import java.util.List;

public interface UserService {
    User register(User user);

    List<User> findAll();

    User findById(Long id);

    User update(Long id, User user);

    void delete(Long id);

    User findByEmail(String email);
}
