package it.unina.demo.dto.response;

import java.util.List;

public record CompletedGameDetailResponse(
        Long gameId,
        String username,
        String startPageTitle,
        String targetPageTitle,
        Integer numSteps,
        Long totalTimeSeconds,
        List<GameStepResponse> path
) {
}