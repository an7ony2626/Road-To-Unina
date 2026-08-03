package it.unina.demo.controller;

import it.unina.demo.dto.request.LoginRequest;
import it.unina.demo.dto.request.RegisterRequest;
import it.unina.demo.dto.response.AuthResponse;
import it.unina.demo.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Registration creates a new User resource: 201 Created.
    // No Location header — there's no GET /api/users/{id} endpoint yet
    // to point at, and adding one just for this would be speculative.
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(201).body(response);
    }

    // Login doesn't create anything, it's an operation that produces a
    // token: 200 OK, not 201.
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}