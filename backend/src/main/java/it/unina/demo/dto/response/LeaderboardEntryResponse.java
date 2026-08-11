package it.unina.demo.dto.response;

public record LeaderboardEntryResponse(
        Long userId,
        String username,
        Long gamesCompleted,
        Integer bestMoves
) {
}