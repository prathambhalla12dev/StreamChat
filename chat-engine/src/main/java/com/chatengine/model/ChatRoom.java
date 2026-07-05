package com.chatengine.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_rooms")
public class ChatRoom {

    @Id
    private String id;

    @Indexed(unique = true)
    private String name;

    private String description;

    private RoomType type;

    private String createdBy;

    private Set<String> memberIds;

    private Set<String> adminIds;

    private boolean isPrivate;

    @CreatedDate
    private Instant createdAt;

    private Instant lastActivity;

    public enum RoomType {
        PUBLIC,
        PRIVATE,
        DIRECT_MESSAGE
    }
}
