package com.chatengine.service;

import com.chatengine.dto.MessageEvent;
import com.chatengine.exception.ChatEngineException;
import com.chatengine.model.ChatRoom;
import com.chatengine.model.Message;
import com.chatengine.model.User;
import com.chatengine.repository.ChatRoomRepository;
import com.chatengine.repository.MessageRepository;
import com.chatengine.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final MessageRepository messageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String REDIS_CHANNEL_PREFIX = "chat.";

    /**
     * Main send-message flow:
     * 1. Validate user is member of room
     * 2. Persist to MongoDB
     * 3. Publish to Redis (broadcasts to ALL K8s nodes)
     * 4. Each node's RedisMessageReceiver forwards to local WS sessions
     */
    public Message sendMessage(String roomId, String senderUsername, String content,
                                Message.MessageType type, String replyToMessageId) {

        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ChatEngineException("Room not found", HttpStatus.NOT_FOUND));

        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new ChatEngineException("User not found", HttpStatus.NOT_FOUND));

        if (!room.getMemberIds().contains(sender.getId())) {
            throw new ChatEngineException("User is not a member of this room", HttpStatus.FORBIDDEN);
        }

        Message message = Message.builder()
                .roomId(roomId)
                .senderId(sender.getId())
                .senderUsername(senderUsername)
                .content(content)
                .type(type != null ? type : Message.MessageType.TEXT)
                .status(Message.MessageStatus.SENT)
                .replyToMessageId(replyToMessageId)
                .edited(false)
                .build();

        Message saved = messageRepository.save(message);

        // Update room last activity asynchronously
        updateRoomLastActivity(roomId);

        // Build the broadcast event
        MessageEvent event = MessageEvent.fromMessage(saved, MessageEvent.EventType.MESSAGE_SENT);

        // Publish to Redis — this reaches ALL pods in the K8s cluster
        publishToRedis(roomId, event);

        log.debug("Message sent to room {}: {}", roomId, saved.getId());
        return saved;
    }

    public Message editMessage(String messageId, String username, String newContent) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ChatEngineException("Message not found", HttpStatus.NOT_FOUND));

        if (!message.getSenderUsername().equals(username)) {
            throw new ChatEngineException("Cannot edit another user's message", HttpStatus.FORBIDDEN);
        }

        message.setContent(newContent);
        message.setEdited(true);
        message.setEditedAt(Instant.now());
        Message updated = messageRepository.save(message);

        publishToRedis(message.getRoomId(),
                MessageEvent.fromMessage(updated, MessageEvent.EventType.MESSAGE_EDITED));

        return updated;
    }

    public void deleteMessage(String messageId, String username, boolean isAdmin) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ChatEngineException("Message not found", HttpStatus.NOT_FOUND));

        if (!isAdmin && !message.getSenderUsername().equals(username)) {
            throw new ChatEngineException("Cannot delete another user's message", HttpStatus.FORBIDDEN);
        }

        MessageEvent deleteEvent = MessageEvent.builder()
                .eventType(MessageEvent.EventType.MESSAGE_DELETED)
                .id(messageId)
                .roomId(message.getRoomId())
                .build();

        messageRepository.deleteById(messageId);
        publishToRedis(message.getRoomId(), deleteEvent);
    }

    /**
     * Paginated message history — uses the compound index (roomId, timestamp DESC)
     * for O(log n) lookups instead of full collection scans.
     */
    public Page<Message> getMessageHistory(String roomId, int page, int size) {
        return messageRepository.findByRoomIdOrderByTimestampDesc(
                roomId, PageRequest.of(page, size));
    }

    /**
     * Cursor-based pagination for infinite scroll — more efficient than offset.
     */
    public List<Message> getMessagesBefore(String roomId, Instant before, int limit) {
        return messageRepository.findByRoomIdBeforeTimestamp(
                roomId, before, PageRequest.of(0, limit));
    }

    /**
     * Broadcast typing indicator — lightweight, NOT persisted.
     */
    public void broadcastTyping(String roomId, String username, boolean isTyping) {
        MessageEvent event = MessageEvent.builder()
                .eventType(isTyping ? MessageEvent.EventType.TYPING_START : MessageEvent.EventType.TYPING_STOP)
                .roomId(roomId)
                .username(username)
                .typing(isTyping)
                .build();

        // Typing events don't need DB persistence — just broadcast via Redis
        publishToRedis(roomId, event);
    }

    /**
     * Publish event to Redis channel for this room.
     * Every K8s pod is subscribed and will forward to its local WebSocket sessions.
     */
    private void publishToRedis(String roomId, MessageEvent event) {
        try {
            String channel = REDIS_CHANNEL_PREFIX + roomId;
            String payload = objectMapper.writeValueAsString(event);
            redisTemplate.convertAndSend(channel, payload);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize event for Redis: {}", e.getMessage());
        }
    }

    @Async
    protected void updateRoomLastActivity(String roomId) {
        chatRoomRepository.findById(roomId).ifPresent(room -> {
            room.setLastActivity(Instant.now());
            chatRoomRepository.save(room);
        });
    }
}
