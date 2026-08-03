package it.unina.demo.dto.response;

import it.unina.demo.entity.GameStatus;

import java.util.List;

public record GameStateResponse(
        Long gameId,
        String startPageTitle,
        String targetPageTitle,
        GameStatus status,
        Integer numSteps,
        String currentPageTitle,
        String currentPageContent,
        List<String> availableLinks,
        List<GameStepResponse> path
) {
}