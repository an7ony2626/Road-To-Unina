package it.unina.demo.dto.response;

import it.unina.demo.entity.GameStatus;

import java.util.List;

// "moves" is clicks-on-a-link, not pages-visited: starting on the first
// page and reaching the target in one click is 1 move, not 2. The
// domain entity still tracks numSteps (pages visited, used to index
// GameStep.stepNumber); this response subtracts 1 at the boundary so
// the API never exposes the off-by-one internal counter.
public record GameStateResponse(
        Long gameId,
        String startPageTitle,
        String targetPageTitle,
        GameStatus status,
        Integer moves,
        String currentPageTitle,
        String currentPageContent,
        List<String> availableLinks,
        List<GameStepResponse> path,
        Long elapsedSeconds
) {
}