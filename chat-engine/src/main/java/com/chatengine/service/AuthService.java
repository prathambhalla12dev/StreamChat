package com.chatengine.service;

import com.chatengine.exception.ChatEngineException;
import com.chatengine.model.User;
import com.chatengine.repository.UserRepository;
import com.chatengine.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public User register(String username, String email, String password, String displayName) {
        if (userRepository.existsByUsername(username)) {
            throw new ChatEngineException("Username already taken", HttpStatus.CONFLICT);
        }
        if (userRepository.existsByEmail(email)) {
            throw new ChatEngineException("Email already registered", HttpStatus.CONFLICT);
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .displayName(displayName != null ? displayName : username)
                .roles(Set.of(User.Role.ROLE_USER))
                .enabled(true)
                .build();

        User saved = userRepository.save(user);
        log.info("New user registered: {}", username);
        return saved;
    }

    public Map<String, String> login(String username, String password) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));

        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        String accessToken = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        log.info("User logged in: {}", username);
        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "tokenType", "Bearer",
                "username", username
        );
    }

    public Map<String, String> refreshToken(String refreshToken) {
        String username = jwtUtil.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ChatEngineException("User not found", HttpStatus.NOT_FOUND));

        if (jwtUtil.isTokenExpired(refreshToken)) {
            throw new ChatEngineException("Refresh token expired", HttpStatus.UNAUTHORIZED);
        }

        // Build UserDetails to regenerate access token
        var userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities(user.getRoles().stream()
                        .map(r -> new org.springframework.security.core.authority.SimpleGrantedAuthority(r.name()))
                        .toList())
                .build();

        return Map.of(
                "accessToken", jwtUtil.generateToken(userDetails),
                "tokenType", "Bearer"
        );
    }
}
