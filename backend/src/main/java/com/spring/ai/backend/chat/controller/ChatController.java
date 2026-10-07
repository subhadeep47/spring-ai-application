package com.spring.ai.backend.chat.controller;

import com.spring.ai.backend.chat.service.ChatService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.UUID;

@CrossOrigin(origins = "http://localhost:5173", exposedHeaders = "X-Chat-Session-ID")
@RestController
@RequestMapping("/api")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping(path = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<Flux<String>> chat(@RequestBody String query, @RequestHeader("X-Chat-Session-ID") String id) {

        String chatId = !id.isEmpty() ? id : UUID.randomUUID().toString();

        Flux<String> aiResponse = chatService.chat(query, chatId);

        return ResponseEntity.ok()
                .header("X-Chat-Session-ID", chatId)
                .body(aiResponse);
    }
}
