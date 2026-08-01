package it.unina.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A single visited page within a game's path. Maps 1:1 to the
 * "game_steps" table in schema.sql. Ordering within a game is given by
 * stepNumber, not by insertion order or id.
 */
@Entity
@Table(
        name = "game_steps",
        uniqueConstraints = @UniqueConstraint(columnNames = {"game_id", "step_number"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    @Column(name = "page_title", nullable = false)
    private String pageTitle;

    @Column(name = "visited_at", nullable = false, updatable = false)
    private LocalDateTime visitedAt;
}