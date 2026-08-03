package it.unina.demo.service;

import it.unina.demo.dto.request.FollowLinkRequest;
import it.unina.demo.dto.response.GameStateResponse;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    private GameRepository gameRepo;
    @Mock
    private GameStepRepository gameStepRepo;
    @Mock
    private UserRepository userRepo;
    @Mock
    private WikiContentService wikiContentService;
    @Mock
    private SecurityUtil securityUtil;

    @InjectMocks
    private GameService gameService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .username("alice")
                .email("alice@example.com")
                .passwordHash("hash")
                .createdAt(LocalDateTime.now())
                .build();

        when(securityUtil.getCurrentUsername()).thenReturn("alice");
        when(userRepo.findByUsername("alice")).thenReturn(Optional.of(user));
    }

    @Test
    void startGame_createsNewGame_whenNoneInProgress() {
        when(gameRepo.findByUserIdAndStatus(1L, GameStatus.IN_PROGRESS)).thenReturn(List.of());
        // Loop in startGame keeps drawing until start != target: first
        // draw is the target, the loop then draws again for a distinct start.
        when(wikiContentService.getRandomPageTitle()).thenReturn("Napoli", "Unina");
        when(wikiContentService.getPageContent("Unina"))
                .thenReturn(new PageContent("Unina", "Unina is a city...", List.of("Campania", "Napoli")));

        GameStateResponse response = gameService.startGame();

        assertEquals("Unina", response.startPageTitle());
        assertEquals("Napoli", response.targetPageTitle());
        assertEquals(GameStatus.IN_PROGRESS, response.status());
        assertEquals(1, response.numSteps());
        assertEquals("Unina", response.currentPageTitle());
        assertEquals(1, response.path().size());
        verify(gameRepo, times(1)).save(any(Game.class));
        verify(gameStepRepo, times(1)).save(any(GameStep.class));
    }

    @Test
    void startGame_resumesExisting_whenInProgressGameFound() {
        Game existing = Game.builder()
                .id(42L)
                .user(user)
                .startPageTitle("Napoli")
                .targetPageTitle("Unina")
                .status(GameStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .numSteps(1)
                .build();

        GameStep existingStep = GameStep.builder()
                .id(1L)
                .game(existing)
                .stepNumber(1)
                .pageTitle("Napoli")
                .visitedAt(LocalDateTime.now())
                .build();

        when(gameRepo.findByUserIdAndStatus(1L, GameStatus.IN_PROGRESS)).thenReturn(List.of(existing));
        when(gameStepRepo.findByGameIdOrderByStepNumberAsc(42L)).thenReturn(List.of(existingStep));
        when(wikiContentService.getPageContent("Napoli"))
                .thenReturn(new PageContent("Napoli", "Napoli is a city...", List.of("Unina")));

        GameStateResponse response = gameService.startGame();

        assertEquals(42L, response.gameId());
        verify(wikiContentService, never()).getRandomPageTitle();
        verify(gameRepo, never()).save(any(Game.class));
    }

    @Test
    void followLink_validMoveReachingTarget_completesGame() {
        Game game = inProgressGame();
        GameStep firstStep = stepOf(game, 1, "Napoli");

        when(gameRepo.findById(42L)).thenReturn(Optional.of(game));
        when(gameStepRepo.findByGameIdOrderByStepNumberAsc(42L)).thenReturn(List.of(firstStep));
        when(wikiContentService.getPageContent("Napoli"))
                .thenReturn(new PageContent("Napoli", "...", List.of("Unina", "Campania")));
        when(wikiContentService.getPageContent("Unina"))
                .thenReturn(new PageContent("Unina", "...", List.of("Napoli")));

        GameStateResponse response = gameService.followLink(42L, new FollowLinkRequest("Unina"));

        assertEquals(GameStatus.COMPLETED, response.status());
        assertEquals(2, response.numSteps());
        assertEquals("Unina", response.currentPageTitle());
    }

    @Test
    void followLink_clickedTitleNotOnCurrentPage_throwsIllegalArgument() {
        Game game = inProgressGame();
        GameStep firstStep = stepOf(game, 1, "Napoli");

        when(gameRepo.findById(42L)).thenReturn(Optional.of(game));
        when(gameStepRepo.findByGameIdOrderByStepNumberAsc(42L)).thenReturn(List.of(firstStep));
        when(wikiContentService.getPageContent("Napoli"))
                .thenReturn(new PageContent("Napoli", "...", List.of("Campania")));

        assertThrows(IllegalArgumentException.class,
                () -> gameService.followLink(42L, new FollowLinkRequest("Unina")));

        verify(gameStepRepo, never()).save(any(GameStep.class));
    }

    @Test
    void followLink_gameOwnedByAnotherUser_throwsSecurityException() {
        User otherUser = User.builder().id(2L).username("bob").email("b@x.com")
                .passwordHash("h").createdAt(LocalDateTime.now()).build();

        Game game = Game.builder()
                .id(42L)
                .user(otherUser)
                .startPageTitle("Napoli")
                .targetPageTitle("Unina")
                .status(GameStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .numSteps(1)
                .build();

        when(gameRepo.findById(42L)).thenReturn(Optional.of(game));

        assertThrows(SecurityException.class,
                () -> gameService.followLink(42L, new FollowLinkRequest("Unina")));
    }

    @Test
    void abandonGame_setsStatusAbandoned() {
        Game game = inProgressGame();
        when(gameRepo.findById(42L)).thenReturn(Optional.of(game));

        gameService.abandonGame(42L);

        assertEquals(GameStatus.ABANDONED, game.getStatus());
        assertTrue(game.getEndedAt() != null);
    }

    @Test
    void getLeaderboard_mapsRepositoryRowsToResponses() {
        Object[] row = {1L, "alice", 3L, 5};
        when(gameRepo.findLeaderboard(GameStatus.COMPLETED)).thenReturn(List.<Object[]>of(row));

        List<LeaderboardEntryResponse> leaderboard = gameService.getLeaderboard();

        assertEquals(1, leaderboard.size());
        assertEquals(new LeaderboardEntryResponse(1L, "alice", 3L, 5), leaderboard.get(0));
    }

    private Game inProgressGame() {
        return Game.builder()
                .id(42L)
                .user(user)
                .startPageTitle("Napoli")
                .targetPageTitle("Unina")
                .status(GameStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .numSteps(1)
                .build();
    }

    private GameStep stepOf(Game game, int stepNumber, String pageTitle) {
        return GameStep.builder()
                .id((long) stepNumber)
                .game(game)
                .stepNumber(stepNumber)
                .pageTitle(pageTitle)
                .visitedAt(LocalDateTime.now())
                .build();
    }
}