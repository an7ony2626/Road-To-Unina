package it.unina.demo.controller;

import it.unina.demo.dto.request.FollowLinkRequest;
import it.unina.demo.dto.request.UpdateGameStatusRequest;
import it.unina.demo.dto.response.CompletedGameDetailResponse;
import it.unina.demo.dto.response.CompletedGameSummaryResponse;
import it.unina.demo.dto.response.GameStateResponse;
import it.unina.demo.dto.response.LeaderboardEntryResponse;
import it.unina.demo.entity.GameStatus;
import it.unina.demo.service.GameService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class GameController {

    private final GameService gameService;

    // Strict REST: POST always creates. Conflict (already-in-progress
    // game) is a 409, not a silent "here's your other game" 200 — the
    // client is expected to call GET /current first to decide whether
    // to resume instead of creating.
    @PostMapping
    public ResponseEntity<GameStateResponse> createGame() {
        GameStateResponse game = gameService.createGame();
        return ResponseEntity.created(URI.create("/api/games/" + game.gameId())).body(game);
    }

    // Static segment "current" is matched before the {id} template by
    // Spring's path matching, no ambiguity with GET /{id}.
    @GetMapping("/current")
    public GameStateResponse getCurrentGame() {
        return gameService.getCurrentGame();
    }

    @GetMapping("/leaderboard")
    public List<LeaderboardEntryResponse> getLeaderboard() {
        return gameService.getLeaderboard();
    }

    @GetMapping("/{id}")
    public GameStateResponse getGame(@PathVariable Long id) {
        return gameService.getGameState(id);
    }

    // A move is a new sub-resource under the game: POST on the
    // /moves collection, 201 with a Location pointing at it.
    @PostMapping("/{id}/moves")
    public ResponseEntity<GameStateResponse> followLink(
            @PathVariable Long id,
            @Valid @RequestBody FollowLinkRequest request
    ) {
        GameStateResponse game = gameService.followLink(id, request);
        URI location = URI.create("/api/games/" + id + "/moves/" + game.numSteps());
        return ResponseEntity.created(location).body(game);
    }

    // Partial update of the game resource's status. Only ABANDONED is a
    // valid client-initiated transition (COMPLETED only happens as a
    // side effect of reaching the target via /moves).
    @PatchMapping("/{id}")
    public GameStateResponse updateGameStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGameStatusRequest request
    ) {
        if (request.status() != GameStatus.ABANDONED)
            throw new IllegalArgumentException("Only transitioning a game to ABANDONED is supported");

        gameService.abandonGame(id);
        return gameService.getGameState(id);
    }

    // Public per la traccia: "tutti gli utenti, anche quelli non
    // registrati, potranno esplorare una raccolta delle partite
    // concluse". @SecurityRequirements vuoto sovrascrive quello a
    // livello di classe, solo per documentare correttamente su Swagger
    // che qui non serve token.
    @io.swagger.v3.oas.annotations.security.SecurityRequirements
    @GetMapping("/completed")
    public List<CompletedGameSummaryResponse> getCompletedGames() {
        return gameService.getCompletedGames();
    }

    @io.swagger.v3.oas.annotations.security.SecurityRequirements
    @GetMapping("/completed/{id}")
    public CompletedGameDetailResponse getCompletedGame(@PathVariable Long id) {
        return gameService.getCompletedGameDetail(id);
    }
}