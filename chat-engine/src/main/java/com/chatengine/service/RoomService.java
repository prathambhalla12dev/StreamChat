package com.chatengine.service;

import com.chatengine.exception.ChatEngineException;
import com.chatengine.model.ChatRoom;
import com.chatengine.model.User;
import com.chatengine.repository.ChatRoomRepository;
import com.chatengine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;

    public ChatRoom createRoom(String name, String description, ChatRoom.RoomType type,
                               boolean isPrivate, String creatorUsername) {
        if (chatRoomRepository.existsByName(name)) {
            throw new ChatEngineException("Room name already taken", HttpStatus.CONFLICT);
        }

        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new ChatEngineException("User not found", HttpStatus.NOT_FOUND));

        ChatRoom room = ChatRoom.builder()
                .name(name)
                .description(description)
                .type(type)
                .isPrivate(isPrivate)
                .createdBy(creator.getId())
                .memberIds(new HashSet<>(Set.of(creator.getId())))
                .adminIds(new HashSet<>(Set.of(creator.getId())))
                .build();

        ChatRoom saved = chatRoomRepository.save(room);
        log.info("Room created: {} by {}", name, creatorUsername);
        return saved;
    }

    public ChatRoom joinRoom(String roomId, String username) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ChatEngineException("Room not found", HttpStatus.NOT_FOUND));

        if (room.isPrivate()) {
            throw new ChatEngineException("Room is private — requires invitation", HttpStatus.FORBIDDEN);
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ChatEngineException("User not found", HttpStatus.NOT_FOUND));

        room.getMemberIds().add(user.getId());
        return chatRoomRepository.save(room);
    }

    public void leaveRoom(String roomId, String username) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ChatEngineException("Room not found", HttpStatus.NOT_FOUND));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ChatEngineException("User not found", HttpStatus.NOT_FOUND));

        room.getMemberIds().remove(user.getId());
        room.getAdminIds().remove(user.getId());
        chatRoomRepository.save(room);
    }

    public ChatRoom inviteUser(String roomId, String inviterUsername, String targetUsername) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ChatEngineException("Room not found", HttpStatus.NOT_FOUND));

        User inviter = userRepository.findByUsername(inviterUsername)
                .orElseThrow(() -> new ChatEngineException("Inviter not found", HttpStatus.NOT_FOUND));

        if (!room.getMemberIds().contains(inviter.getId())) {
            throw new ChatEngineException("Only members can invite others", HttpStatus.FORBIDDEN);
        }

        User target = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new ChatEngineException("Target user not found", HttpStatus.NOT_FOUND));

        room.getMemberIds().add(target.getId());
        return chatRoomRepository.save(room);
    }

    public ChatRoom getOrCreateDirectMessage(String username1, String username2) {
        User user1 = userRepository.findByUsername(username1)
                .orElseThrow(() -> new ChatEngineException("User not found", HttpStatus.NOT_FOUND));
        User user2 = userRepository.findByUsername(username2)
                .orElseThrow(() -> new ChatEngineException("User not found", HttpStatus.NOT_FOUND));

        return chatRoomRepository.findDirectMessageRoom(user1.getId(), user2.getId())
                .orElseGet(() -> {
                    ChatRoom dm = ChatRoom.builder()
                            .name("dm-" + user1.getId() + "-" + user2.getId())
                            .type(ChatRoom.RoomType.DIRECT_MESSAGE)
                            .isPrivate(true)
                            .createdBy(user1.getId())
                            .memberIds(Set.of(user1.getId(), user2.getId()))
                            .adminIds(Set.of(user1.getId(), user2.getId()))
                            .build();
                    return chatRoomRepository.save(dm);
                });
    }

    public List<ChatRoom> getPublicRooms() {
        return chatRoomRepository.findByTypeAndIsPrivateFalse(ChatRoom.RoomType.PUBLIC);
    }

    public List<ChatRoom> getUserRooms(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ChatEngineException("User not found", HttpStatus.NOT_FOUND));
        return chatRoomRepository.findRoomsByMember(user.getId());
    }
}
