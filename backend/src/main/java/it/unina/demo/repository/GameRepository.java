package it.unina.demo.repository;

import it.unina.demo.entity.Game;
import it.unina.demo.entity.GameStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GameRepository extends JpaRepository<Game, Long> {

    // Needed to let a user resume: "riprendere la partita su un
    // dispositivo diverso" requires finding their in-progress game.
    List<Game> findByUserIdAndStatus(Long userId, GameStatus status);

    // GameRepository.java — sostituisce l'uso di findByStatusOrderByStartedAtDesc
    @Query("""
            SELECT g FROM Game g
            JOIN FETCH g.user
            WHERE g.status = :status
            ORDER BY g.startedAt DESC
            """)
    List<Game> findByStatusWithUserOrderByStartedAtDesc(@Param("status") GameStatus status);

    // stesso problema latente in getCompletedGameDetail -> serve anche questa
    @Query("""
            SELECT g FROM Game g
            JOIN FETCH g.user
            WHERE g.id = :id
            """)
    Optional<Game> findByIdWithUser(@Param("id") Long id);
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