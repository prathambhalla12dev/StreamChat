package com.chatengine.controller;

import com.chatengine.model.ChatRoom;
import com.chatengine.model.Message;
import com.chatengine.service.ChatService;
import com.chatengine.service.RoomService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;
    private final RoomService roomService;

    // ==================== Room Endpoints ====================

    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoom>> getPublicRooms() {
        return ResponseEntity.ok(roomService.getPublicRooms());
    }

    @GetMapping("/rooms/mine")
    public ResponseEntity<List<ChatRoom>> getMyRooms(Principal principal) {
        return ResponseEntity.ok(roomService.getUserRooms(principal.getName()));
    }

    @PostMapping("/rooms")
    public ResponseEntity<ChatRoom> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            Principal principal) {

        ChatRoom room = roomService.createRoom(
                request.getName(),
                request.getDescription(),
                request.getType() != null ? request.getType() : ChatRoom.RoomType.PUBLIC,
                request.isPrivateRoom(),
                principal.getName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }

    @PostMapping("/rooms/{roomId}/join")
    public ResponseEntity<ChatRoom> joinRoom(@PathVariable String roomId, Principal principal) {
        return ResponseEntity.ok(roomService.joinRoom(roomId, principal.getName()));
    }

    @PostMapping("/rooms/{roomId}/leave")
    public ResponseEntity<Map<String, String>> leaveRoom(@PathVariable String roomId, Principal principal) {
        roomService.leaveRoom(roomId, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Left room successfully"));
    }

    @PostMapping("/rooms/{roomId}/invite/{targetUsername}")
    public ResponseEntity<ChatRoom> inviteUser(
            @PathVariable String roomId,
            @PathVariable String targetUsername,
            Principal principal) {
        return ResponseEntity.ok(roomService.inviteUser(roomId, principal.getName(), targetUsername));
    }

    @PostMapping("/rooms/dm/{targetUsername}")
    public ResponseEntity<ChatRoom> getOrCreateDM(
            @PathVariable String targetUsername,
            Principal principal) {
        return ResponseEntity.ok(roomService.getOrCreateDirectMessage(principal.getName(), targetUsername));
    }

    // ==================== Message Endpoints ====================

    /**
     * Paginated message history using compound index on (roomId, timestamp).
     */
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<Page<Message>> getMessages(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        return ResponseEntity.ok(chatService.getMessageHistory(roomId, page, size));
    }

    /**
     * Cursor-based message loading for infinite scroll.
     */
    @GetMapping("/rooms/{roomId}/messages/before")
    public ResponseEntity<List<Message>> getMessagesBefore(
            @PathVariable String roomId,
            @RequestParam String before,
            @RequestParam(defaultValue = "50") int limit) {

        Instant cursor = Instant.parse(before);
        return ResponseEntity.ok(chatService.getMessagesBefore(roomId, cursor, limit));
    }

    @PatchMapping("/messages/{messageId}")
    public ResponseEntity<Message> editMessage(
            @PathVariable String messageId,
            @Valid @RequestBody EditMessageRequest request,
            Principal principal) {

        return ResponseEntity.ok(chatService.editMessage(messageId, principal.getName(), request.getContent()));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable String messageId,
            Principal principal) {

        boolean isAdmin = false; // Could check roles here
        chatService.deleteMessage(messageId, principal.getName(), isAdmin);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/admin/messages/{messageId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Void> adminDeleteMessage(@PathVariable String messageId, Principal principal) {
        chatService.deleteMessage(messageId, principal.getName(), true);
        return ResponseEntity.noContent().build();
    }

    // ---- Request Bodies ----

    @Data
    static class CreateRoomRequest {
        @NotBlank
        @Size(min = 2, max = 50)
        private String name;

        @Size(max = 200)
        private String description;

        private ChatRoom.RoomType type;

        private boolean privateRoom;
    }

    @Data
    static class EditMessageRequest {
        @NotBlank
        @Size(max = 4000)
        private String content;
    }
}
