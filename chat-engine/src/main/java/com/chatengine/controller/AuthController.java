package com.chatengine.controller;

import com.chatengine.model.User;
import com.chatengine.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(
                request.getUsername(),
                request.getEmail(),
                request.getPassword(),
                request.getDisplayName()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "id", user.getId(),
                        "username", user.getUsername(),
                        "email", user.getEmail(),
                        "message", "Registration successful"
                ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@Valid @RequestBody LoginRequest request) {
        Map<String, String> tokens = authService.login(request.getUsername(), request.getPassword());
        return ResponseEntity.ok(tokens);
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }

    // ---- Request Bodies ----

    @Data
    static class RegisterRequest {
        @NotBlank
        @Size(min = 3, max = 30)
        private String username;

        @NotBlank
        @Email
        private String email;

        @NotBlank
        @Size(min = 8, max = 100)
        private String password;

        private String displayName;
    }

    @Data
    static class LoginRequest {
        @NotBlank
        private String username;

        @NotBlank
        private String password;
    }
}
