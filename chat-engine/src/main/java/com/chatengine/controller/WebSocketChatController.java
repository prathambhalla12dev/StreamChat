package com.chatengine.controller;

import com.chatengine.model.Message;
import com.chatengine.service.ChatService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * Handles inbound STOMP messages over WebSocket.
 *
 * Client sends to:   /app/chat.{roomId}.send
 * Broadcasts to:     /topic/room.{roomId}   (via Redis pub/sub)
 *
 * Typing indicators:
 * Client sends to:   /app/chat.{roomId}.typing
 * Broadcasts to:     /topic/room.{roomId}
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketChatController {

    private final ChatService chatService;

    /**
     * Handle incoming chat message from authenticated WebSocket client.
     * The Principal is populated by our JWT WebSocket interceptor in WebSocketConfig.
     */
    @MessageMapping("/chat.{roomId}.send")
    public void sendMessage(
            @DestinationVariable String roomId,
            @Payload @Valid SendMessagePayload payload,
            Principal principal) {

        if (principal == null) {
            log.warn("Unauthenticated WebSocket message attempt to room {}", roomId);
            return;
        }

        log.debug("WS message from {} to room {}", principal.getName(), roomId);

        chatService.sendMessage(
                roomId,
                principal.getName(),
                payload.getContent(),
                payload.getType() != null ? payload.getType() : Message.MessageType.TEXT,
                payload.getReplyToMessageId()
        );
    }

    /**
     * Handle typing indicator — lightweight, not persisted.
     */
    @MessageMapping("/chat.{roomId}.typing")
    public void handleTyping(
            @DestinationVariable String roomId,
            @Payload TypingPayload payload,
            Principal principal) {

        if (principal == null) return;
        chatService.broadcastTyping(roomId, principal.getName(), payload.isTyping());
    }

    // ---- Payload classes ----

    @Data
    public static class SendMessagePayload {
        @NotBlank
        @Size(max = 4000)
        private String content;

        private Message.MessageType type;

        private String replyToMessageId;
    }

    @Data
    public static class TypingPayload {
        private boolean typing;
    }
}
