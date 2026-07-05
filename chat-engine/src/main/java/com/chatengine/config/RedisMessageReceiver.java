package com.chatengine.config;

import com.chatengine.dto.MessageEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisMessageReceiver {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Called when a message arrives via Redis pub/sub from another pod.
     * We forward it to the WebSocket topic for this room so local subscribers see it.
     */
    public void receiveMessage(String messageJson, String channel) {
        try {
            MessageEvent event = objectMapper.readValue(messageJson, MessageEvent.class);
            String roomId = event.getRoomId();

            log.debug("Redis relay -> room {} from channel {}", roomId, channel);
            messagingTemplate.convertAndSend("/topic/room." + roomId, event);

        } catch (Exception e) {
            log.error("Failed to deserialize Redis message from channel {}: {}", channel, e.getMessage());
        }
    }
}
