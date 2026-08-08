package it.unina.demo.service;

import it.unina.demo.dto.request.CreateGameRequest;
import it.unina.demo.dto.request.FollowLinkRequest;
import it.unina.demo.dto.response.CompletedGameDetailResponse;
import it.unina.demo.dto.response.CompletedGameSummaryResponse;
import it.unina.demo.dto.response.GameStateResponse;
import it.unina.demo.dto.response.GameStepResponse;
import it.unina.demo.dto.response.LeaderboardEntryResponse;
import it.unina.demo.entity.Game;
import it.unina.demo.entity.GameStatus;
import it.unina.demo.entity.GameStep;
import it.unina.demo.entity.User;
import it.unina.demo.repository.GameRepository;
import it.unina.demo.repository.GameStepRepository;
import it.unina.demo.repository.UserRepository;
import it.unina.demo.service.wiki.PageContent;
import it.unina.demo.service.wiki.WikiContentService;
import it.unina.demo.util.SecurityUtil;
import it.unina.demo.util.StringConstants;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GameService {

    // Safety cap so a pathological run of identical random picks can't
    // spin forever; with millions of articles this never realistically
    // triggers more than once.
    private static final int MAX_RANDOM_PICK_ATTEMPTS = 5;

    private final GameRepository gameRepo;
    private final GameStepRepository gameStepRepo;
    private final UserRepository userRepo;
    private final WikiContentService wikiContentService;
    private final SecurityUtil securityUtil;

    // GameService.java
    @Transactional
    public GameStateResponse createGame(CreateGameRequest request) {
        User user = getCurrentUser();

        List<Game> existing = gameRepo.findByUserIdAndStatus(user.getId(), GameStatus.IN_PROGRESS);
        if (!existing.isEmpty())
            throw new IllegalStateException("You already have a game in progress");

        String requestedStart = blankToNull(request.startPageTitle());
        String requestedTarget = blankToNull(request.targetPageTitle());

        if (requestedStart != null && requestedTarget != null && requestedStart.equalsIgnoreCase(requestedTarget))
            throw new IllegalArgumentException("Start and target page must be different");

        String targetTitle = requestedTarget != null
                ? wikiContentService.getPageContent(requestedTarget).title()
                : wikiContentService.getRandomPageTitle();

        String startTitle = requestedStart != null
                ? wikiContentService.getPageContent(requestedStart).title()
                : pickRandomStartDistinctFrom(targetTitle);

        if (startTitle.equals(targetTitle))
            throw new IllegalStateException("Could not pick two distinct pages, try again");

        PageContent startPage = wikiContentService.getPageContent(startTitle);

        Game game = Game.builder()
                .user(user)
                .startPageTitle(startPage.title())
                .targetPageTitle(targetTitle)
                .status(GameStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .numSteps(1)
                .build();

        gameRepo.save(game);

        GameStep firstStep = GameStep.builder()
                .game(game)
                .stepNumber(1)
                .pageTitle(startPage.title())
                .visitedAt(LocalDateTime.now())
                .build();

        gameStepRepo.save(firstStep);

        return buildGameState(game, startPage, List.of(firstStep));
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }

    private String pickRandomStartDistinctFrom(String targetTitle) {
        String startTitle = targetTitle;
        for (int attempt = 0; attempt < MAX_RANDOM_PICK_ATTEMPTS && startTitle.equals(targetTitle); attempt++) {
            startTitle = wikiContentService.getRandomPageTitle();
        }
        return startTitle;
    }

    public GameStateResponse getCurrentGame() {
        User user = getCurrentUser();

        Game game = gameRepo.findByUserIdAndStatus(user.getId(), GameStatus.IN_PROGRESS).stream()
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("No game currently in progress"));

        return buildGameState(game);
    }
    
    @Transactional
    public GameStateResponse followLink(Long gameId, FollowLinkRequest request) {
        User user = getCurrentUser();
        Game game = getOwnedInProgressGame(user, gameId);

        List<GameStep> steps = gameStepRepo.findByGameIdOrderByStepNumberAsc(game.getId());
        String currentTitle = steps.get(steps.size() - 1).getPageTitle();

        PageContent currentPage = wikiContentService.getPageContent(currentTitle);

        if (!currentPage.linkTitles().contains(request.clickedTitle()))
            throw new IllegalArgumentException(
                    "'" + request.clickedTitle() + "' is not a link on the current page");

        PageContent nextPage = wikiContentService.getPageContent(request.clickedTitle());

        int nextStepNumber = game.getNumSteps() + 1;

        GameStep step = GameStep.builder()
                .game(game)
                .stepNumber(nextStepNumber)
                .pageTitle(nextPage.title())
                .visitedAt(LocalDateTime.now())
                .build();

        gameStepRepo.save(step);

        game.setNumSteps(nextStepNumber);

        if (nextPage.title().equals(game.getTargetPageTitle())) {
            game.setStatus(GameStatus.COMPLETED);
            game.setEndedAt(LocalDateTime.now());
        }

        List<GameStep> updatedSteps = new ArrayList<>(steps);
        updatedSteps.add(step);
        return buildGameState(game, nextPage, updatedSteps);
    }

    @Transactional
    public void abandonGame(Long gameId) {
        User user = getCurrentUser();
        Game game = getOwnedInProgressGame(user, gameId);

        game.setStatus(GameStatus.ABANDONED);
        game.setEndedAt(LocalDateTime.now());
    }

    public GameStateResponse getGameState(Long gameId) {
        User user = getCurrentUser();
        Game game = getOwnedGame(user, gameId);
        return buildGameState(game);
    }

    public List<LeaderboardEntryResponse> getLeaderboard() {
        return gameRepo.findLeaderboard(GameStatus.COMPLETED).stream()
                .map(row -> new LeaderboardEntryResponse(
                        (Long) row[0],
                        (String) row[1],
                        (Long) row[2],
                        ((Number) row[3]).intValue()
                ))
                .toList();
    }

    private User getCurrentUser() {
        String username = securityUtil.getCurrentUsername();
        return userRepo.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException(StringConstants.USER_NOT_FOUND_MESSAGE));
    }

    private Game getOwnedGame(User user, Long gameId) {
        Game game = gameRepo.findById(gameId)
                .orElseThrow(() -> new EntityNotFoundException("Game not found: " + gameId));

        if (!game.getUser().getId().equals(user.getId()))
            throw new SecurityException("This game does not belong to you");

        return game;
    }

    private Game getOwnedInProgressGame(User user, Long gameId) {
        Game game = getOwnedGame(user, gameId);

        if (game.getStatus() != GameStatus.IN_PROGRESS)
            throw new IllegalStateException("Game is not in progress");

        return game;
    }

    private GameStateResponse buildGameState(Game game) {
        List<GameStep> steps = gameStepRepo.findByGameIdOrderByStepNumberAsc(game.getId());
        String currentTitle = steps.get(steps.size() - 1).getPageTitle();
        PageContent currentPage = wikiContentService.getPageContent(currentTitle);
        return buildGameState(game, currentPage, steps);
    }

    private GameStateResponse buildGameState(Game game, PageContent currentPage, List<GameStep> steps) {
        List<GameStepResponse> path = steps.stream()
                .map(s -> new GameStepResponse(s.getStepNumber(), s.getPageTitle()))
                .toList();

        return new GameStateResponse(
                game.getId(),
                game.getStartPageTitle(),
                game.getTargetPageTitle(),
                game.getStatus(),
                game.getNumSteps(),
                currentPage.title(),
                currentPage.content(),
                currentPage.linkTitles(),
                path,
                game.getStartedAt()
        );
    }

    public List<CompletedGameSummaryResponse> getCompletedGames() {
        return gameRepo.findByStatusWithUserOrderByStartedAtDesc(GameStatus.COMPLETED).stream()
                .map(this::toSummary)
                .toList();
    }


    public CompletedGameDetailResponse getCompletedGameDetail(Long gameId) {
        Game game = gameRepo.findByIdWithUser(gameId)
            .filter(g -> g.getStatus() == GameStatus.COMPLETED)
            .orElseThrow(() -> new EntityNotFoundException("Completed game not found: " + gameId));

        List<GameStep> steps = gameStepRepo.findByGameIdOrderByStepNumberAsc(game.getId());

        List<GameStepResponse> path = steps.stream()
                .map(s -> new GameStepResponse(s.getStepNumber(), s.getPageTitle()))
                .toList();

        return new CompletedGameDetailResponse(
                game.getId(),
                game.getUser().getUsername(),
                game.getStartPageTitle(),
                game.getTargetPageTitle(),
                game.getNumSteps(),
                Duration.between(game.getStartedAt(), game.getEndedAt()).getSeconds(),
                path
        );
    }

    private CompletedGameSummaryResponse toSummary(Game game) {
        return new CompletedGameSummaryResponse(
                game.getId(),
                game.getUser().getUsername(),
                game.getStartPageTitle(),
                game.getTargetPageTitle(),
                game.getNumSteps(),
                Duration.between(game.getStartedAt(), game.getEndedAt()).getSeconds()
        );
    }
}