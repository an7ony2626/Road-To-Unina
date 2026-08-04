package it.unina.demo.dto.request;

import it.unina.demo.entity.GameStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateGameStatusRequest(
        @NotNull GameStatus status
) {
}