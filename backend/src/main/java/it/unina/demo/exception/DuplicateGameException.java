package it.unina.demo.exception;

import lombok.Getter;

@Getter
public class DuplicateGameException extends RuntimeException {

    private final Long existingGameId;
    private final int existingMoves;

    public DuplicateGameException(Long existingGameId, int existingMoves) {
        super("Hai già completato una partita con questa stessa coppia di pagine");
        this.existingGameId = existingGameId;
        this.existingMoves = existingMoves;
    }
}