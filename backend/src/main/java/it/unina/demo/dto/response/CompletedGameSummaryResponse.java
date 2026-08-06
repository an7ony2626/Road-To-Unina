package it.unina.demo.dto.response;

public record CompletedGameSummaryResponse(
        Long gameId,
        String username,
        String startPageTitle,
        String targetPageTitle,
        Integer numSteps,
        Long totalTimeSeconds
) {
}