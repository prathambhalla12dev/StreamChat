package com.chatengine.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ChatEngineException extends RuntimeException {

    private final HttpStatus status;

    public ChatEngineException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
