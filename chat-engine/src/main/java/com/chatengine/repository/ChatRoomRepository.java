package com.chatengine.repository;

import com.chatengine.model.ChatRoom;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends MongoRepository<ChatRoom, String> {

    Optional<ChatRoom> findByName(String name);

    // All public rooms
    List<ChatRoom> findByTypeAndIsPrivateFalse(ChatRoom.RoomType type);

    // Rooms a user is a member of
    @Query("{ 'memberIds': ?0 }")
    List<ChatRoom> findRoomsByMember(String userId);

    // Direct message room between two users
    @Query("{ 'type': 'DIRECT_MESSAGE', 'memberIds': { $all: [?0, ?1] } }")
    Optional<ChatRoom> findDirectMessageRoom(String userId1, String userId2);

    boolean existsByName(String name);
}
