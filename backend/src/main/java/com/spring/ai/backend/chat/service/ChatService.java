package com.spring.ai.backend.chat.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class ChatService {

    private final String SYSTEM_PROMPT = """
            You are an AI assistant integrated into food delivery app customer service.
            Never output a generic list of capabilities, markdown feature tables,
            or introductory self-descriptions. If a user asks what you can do or
            asks a broad meta-query, concisely ask how you can help them with
            their specific task.
            """;

    private final ChatClient chatClient;

    public ChatService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public Flux<String> chat(String query) {
        Flux<String> response = chatClient
                .prompt()
                .system(SYSTEM_PROMPT)
                .user(query)
                .stream()
                .content();
        return response;
    }
}
