package it.unina.demo.repository;

import it.unina.demo.entity.GameStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameStepRepository extends JpaRepository<GameStep, Long> {

    // Path reconstruction relies on stepNumber, not insertion/id order,
    // matching the UNIQUE(game_id, step_number) constraint in schema.sql.
    List<GameStep> findByGameIdOrderByStepNumberAsc(Long gameId);
}