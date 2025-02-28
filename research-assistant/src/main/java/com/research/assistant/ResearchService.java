package com.research.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
public class ResearchService {
    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public ResearchService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    public String processContent(ResearchRequest researchRequest) {
        String prompt = buildPrompt(researchRequest);
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        // Fixed API URL construction - directly use the built URL from properties
        String fullUrl = geminiApiUrl + geminiApiKey;

        try {
            String response = webClient.post()
                    .uri(fullUrl)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return extractTextFromResponse(response);
        } catch (Exception e) {
            return "Error calling Gemini API: " + e.getMessage();
        }
    }

    private String extractTextFromResponse(String response) {
        try {
            GeminiResponse geminiResponse = objectMapper.readValue(response, GeminiResponse.class);
            if (geminiResponse.getCandidates() != null && !geminiResponse.getCandidates().isEmpty()) {
                GeminiResponse.Candidate firstCandidate = geminiResponse.getCandidates().get(0);
                if (firstCandidate.getContent() != null &&
                        firstCandidate.getContent().getParts() != null &&
                        !firstCandidate.getContent().getParts().isEmpty()) {
                    return firstCandidate.getContent().getParts().get(0).getText();
                }
            }
            return "No valid content found in response";
        } catch (Exception e) {
            return "Error parsing response: " + e.getMessage();
        }
    }

    private String buildPrompt(ResearchRequest researchRequest) {
        StringBuilder prompt = new StringBuilder();
        switch (researchRequest.getOperation()) {
            case "summarize":
                prompt.append("Provide a clear & concise summary of the following text in a few sentences in proper Structure:\n\n");
                break;
            case "suggest":
                prompt.append("Based on the following content: suggest related topics & further reading. Format the response with clear headings & bullet points:\n\n");
                break;
            default:
                throw new IllegalArgumentException("Unknown operation: " + researchRequest.getOperation());
        }
        prompt.append(researchRequest.getContent());
        return prompt.toString();
    }
}