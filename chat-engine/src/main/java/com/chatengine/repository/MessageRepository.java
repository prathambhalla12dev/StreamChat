package com.chatengine.repository;

import com.chatengine.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

    /**
     * Paginated message retrieval using the compound index (roomId, timestamp DESC).
     * This avoids full collection scans.
     */
    Page<Message> findByRoomIdOrderByTimestampDesc(String roomId, Pageable pageable);

    /**
     * Cursor-based pagination — fetch messages before a given timestamp.
     * More efficient than offset-based for large datasets.
     */
    @Query("{ 'roomId': ?0, 'timestamp': { $lt: ?1 } }")
    List<Message> findByRoomIdBeforeTimestamp(String roomId, Instant before, Pageable pageable);

    /**
     * Fetch unread messages since last seen timestamp per user.
     */
    @Query("{ 'roomId': ?0, 'timestamp': { $gt: ?1 }, 'senderId': { $ne: ?2 } }")
    List<Message> findUnreadMessages(String roomId, Instant since, String excludeUserId);

    /**
     * Full-text search within a room (requires text index on 'content').
     */
    @Query("{ 'roomId': ?0, '$text': { '$search': ?1 } }")
    List<Message> searchMessagesInRoom(String roomId, String searchText, Pageable pageable);

    long countByRoomId(String roomId);

    void deleteAllByRoomId(String roomId);
}
