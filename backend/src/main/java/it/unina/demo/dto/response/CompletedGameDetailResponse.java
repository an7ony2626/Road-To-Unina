package it.unina.demo.dto.response;

import java.util.List;

public record CompletedGameDetailResponse(
        Long gameId,
        String username,
        String startPageTitle,
        String targetPageTitle,
        Integer moves,
        Long totalTimeSeconds,
        Boolean isRandomChallenge,
        List<GameStepResponse> path
) {
}