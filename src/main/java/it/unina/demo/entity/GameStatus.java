package it.unina.demo.entity;

/**
 * Status of a game, mirroring the CHECK constraint on games.status
 * defined in schema.sql. Keeping this enum in sync with the database
 * constraint is a manual responsibility: if you add a status here,
 * update the CHECK constraint too, and vice versa.
 */
public enum GameStatus {
    IN_PROGRESS,
    COMPLETED,
    ABANDONED
}