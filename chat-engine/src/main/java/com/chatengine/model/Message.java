package com.chatengine.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "messages")
@CompoundIndexes({
    // Optimized compound index for room-based message retrieval (sorted by time desc)
    @CompoundIndex(name = "room_timestamp_idx", def = "{'roomId': 1, 'timestamp': -1}"),
    // Index for fetching messages after a cursor (pagination)
    @CompoundIndex(name = "room_id_cursor_idx", def = "{'roomId': 1, '_id': -1}")
})
public class Message {

    @Id
    private String id;

    @Indexed
    private String roomId;

    private String senderId;

    private String senderUsername;

    private String content;

    private MessageType type;

    private MessageStatus status;

    @CreatedDate
    @Indexed
    private Instant timestamp;

    // For reply threads
    private String replyToMessageId;

    // For edited messages
    private boolean edited;
    private Instant editedAt;

    // For reactions (emoji -> list of userIds)
    private Map<String, List<String>> reactions;

    // For system messages (user joined, left, etc.)
    private Map<String, Object> metadata;

    public enum MessageType {
        TEXT,
        IMAGE,
        FILE,
        SYSTEM,
        TYPING_INDICATOR
    }

    public enum MessageStatus {
        SENT,
        DELIVERED,
        READ
    }
}
