package com.chatengine.dto;

import com.chatengine.model.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Serialized over Redis pub/sub between Kubernetes pods.
 * Must be fully self-contained (no lazy-loaded references).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageEvent {

    public enum EventType {
        MESSAGE_SENT,
        MESSAGE_EDITED,
        MESSAGE_DELETED,
        TYPING_START,
        TYPING_STOP,
        USER_JOINED,
        USER_LEFT,
        REACTION_ADDED
    }

    private EventType eventType;

    // Message fields
    private String id;
    private String roomId;
    private String senderId;
    private String senderUsername;
    private String content;
    private Message.MessageType messageType;
    private Message.MessageStatus status;
    private Instant timestamp;
    private String replyToMessageId;
    private boolean edited;
    private Map<String, List<String>> reactions;

    // Typing / presence fields
    private boolean typing;
    private String username;

    public static MessageEvent fromMessage(Message msg, EventType eventType) {
        return MessageEvent.builder()
                .eventType(eventType)
                .id(msg.getId())
                .roomId(msg.getRoomId())
                .senderId(msg.getSenderId())
                .senderUsername(msg.getSenderUsername())
                .content(msg.getContent())
                .messageType(msg.getType())
                .status(msg.getStatus())
                .timestamp(msg.getTimestamp())
                .replyToMessageId(msg.getReplyToMessageId())
                .edited(msg.isEdited())
                .reactions(msg.getReactions())
                .build();
    }
}
