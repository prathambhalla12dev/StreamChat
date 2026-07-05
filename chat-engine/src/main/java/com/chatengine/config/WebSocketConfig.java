package com.chatengine.config;

import com.chatengine.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // Fallback for environments without WebSocket support
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable simple in-memory broker for subscriptions
        // In production with Kubernetes, replace with Redis/RabbitMQ broker relay
        registry.enableSimpleBroker(
            "/topic",   // For broadcast (room messages)
            "/queue"    // For private messages (user-to-user)
        );
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    /**
     * Intercept STOMP CONNECT frames to authenticate via JWT.
     * This is critical because HTTP security filters don't cover WebSocket messages.
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                        message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    String token = null;

                    if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                        token = authHeader.substring(7);
                    }

                    if (token != null) {
                        try {
                            String username = jwtUtil.extractUsername(token);
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                            if (jwtUtil.validateToken(token, userDetails)) {
                                UsernamePasswordAuthenticationToken auth =
                                        new UsernamePasswordAuthenticationToken(
                                                userDetails, null, userDetails.getAuthorities());
                                accessor.setUser(auth);
                                log.debug("WebSocket authenticated: {}", username);
                            }
                        } catch (Exception e) {
                            log.warn("WebSocket JWT authentication failed: {}", e.getMessage());
                            throw new IllegalArgumentException("Invalid token", e);
                        }
                    }
                }

                return message;
            }
        });
    }
}
