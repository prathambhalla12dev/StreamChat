package com.chatengine.dto;

import com.chatengine.model.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

// ===================== Auth DTOs =====================

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class LoginRequest {
    private String username;
    private String password;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class RegisterRequest {
    private String username;
    private String email;
    private String password;
    private String displayName;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private String username;
    private List<String> roles;
}

// ===================== Message DTOs =====================

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class SendMessageRequest {
    private String content;
    private Message.MessageType type;
    private String replyToMessageId;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class MessageResponse {
    private String id;
    private String roomId;
    private String senderId;
    private String senderUsername;
    private String content;
    private Message.MessageType type;
    private Message.MessageStatus status;
    private Instant timestamp;
    private boolean edited;
    private Map<String, List<String>> reactions;
}

// ===================== WebSocket Event DTO =====================

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class TypingEvent {
    private String roomId;
    private String username;
    private boolean typing;
}
