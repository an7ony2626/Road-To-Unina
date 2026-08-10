package it.unina.demo.repository;

import it.unina.demo.entity.Game;
import it.unina.demo.entity.GameStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GameRepository extends JpaRepository<Game, Long> {

    // Needed to let a user resume: "riprendere la partita su un
    // dispositivo diverso" requires finding their in-progress game.
    List<Game> findByUserIdAndStatus(Long userId, GameStatus status);

    // isRandom is nullable: null means "no filter", true/false narrows
    // to random-challenge or custom-picked games only. Same pattern used
    // by findLeaderboard below, kept consistent on purpose.
    @Query("""
            SELECT g FROM Game g
            JOIN FETCH g.user
            WHERE g.status = :status
            AND (:isRandom IS NULL OR g.isRandomChallenge = :isRandom)
            ORDER BY g.startedAt DESC
            """)
    Page<Game> findCompletedGames(
            @Param("status") GameStatus status,
            @Param("isRandom") Boolean isRandom,
            Pageable pageable
    );

    // stesso problema latente in getCompletedGameDetail -> serve anche questa
    @Query("""
            SELECT g FROM Game g
            JOIN FETCH g.user
            WHERE g.id = :id
            """)
    Optional<Game> findByIdWithUser(@Param("id") Long id);

    // For each user, how many games they completed and their best
    // (lowest) step count, optionally narrowed to only random-challenge
    // or only custom-picked games — see GameFilterMode.
    @Query("""
            SELECT g.user.id, g.user.username, COUNT(g), MIN(g.numSteps)
            FROM Game g
            WHERE g.status = :status
            AND (:isRandom IS NULL OR g.isRandomChallenge = :isRandom)
            GROUP BY g.user.id, g.user.username
            ORDER BY MIN(g.numSteps) ASC
            """)
    List<Object[]> findLeaderboard(@Param("status") GameStatus status, @Param("isRandom") Boolean isRandom);
}