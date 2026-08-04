package it.unina.demo.repository;

import it.unina.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Needed for login: look up a user by the credential they typed in.
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    // Needed for registration: fail fast with a clear message before
    // hitting the database's UNIQUE constraint.
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}