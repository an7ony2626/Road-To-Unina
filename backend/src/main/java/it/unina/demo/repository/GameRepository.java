package it.unina.demo.repository;

import it.unina.demo.entity.Game;
import it.unina.demo.entity.GameStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GameRepository extends JpaRepository<Game, Long> {

    // Needed to let a user resume: "riprendere la partita su un
    // dispositivo diverso" requires finding their in-progress game.
    List<Game> findByUserIdAndStatus(Long userId, GameStatus status);

    // Public browsing of finished games (available to unauthenticated
    // users too, per the spec) does not need any user filter.
    List<Game> findByStatusOrderByStartedAtDesc(GameStatus status);

    // Starting point for the leaderboard: for each user, how many games
    // they completed and their best (lowest) step count. This is
    // intentionally minimal — refine sorting/tie-breaking rules once the
    // service layer defines exactly how the ranking should read.
    @Query("""
            SELECT g.user.id, g.user.username, COUNT(g), MIN(g.numSteps)
            FROM Game g
            WHERE g.status = :status
            GROUP BY g.user.id, g.user.username
            ORDER BY MIN(g.numSteps) ASC
            """)
    List<Object[]> findLeaderboard(@Param("status") GameStatus status);
}