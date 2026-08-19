package it.unina.demo.dto.response;

public record DuplicateGameResponse(
        String message,
        Long existingGameId,
        int existingMoves
) {
}