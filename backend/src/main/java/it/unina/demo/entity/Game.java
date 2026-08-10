package it.unina.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A single game session started by a registered user. Maps 1:1 to the
 * "games" table in schema.sql.
 *
 * Note: consistency between status and endedAt (endedAt is null only
 * while IN_PROGRESS) is enforced by a CHECK constraint at the database
 * level, not duplicated here in Java. The service layer must still set
 * both fields together when closing a game, otherwise the insert/update
 * will fail fast against the database.
 */
@Entity
@Table(name = "games")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FetchType.LAZY: the owning user is only loaded when actually accessed,
    // not automatically pulled in every time a Game is fetched.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "start_page_title", nullable = false)
    private String startPageTitle;

    @Column(name = "target_page_title", nullable = false)
    private String targetPageTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private GameStatus status;

    @Column(name = "started_at", nullable = false, updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "num_steps", nullable = false)
    private Integer numSteps;

    // Banked (frozen) active playtime in seconds, accumulated across
    // pause/resume cycles. Combined with lastResumedAt this replaces a
    // naive (now - startedAt) calculation, which would count idle time
    // spent away from the game as "time taken".
    @Column(name = "active_seconds", nullable = false)
    private Long activeSeconds;

    // Timestamp of the last resume. Null means the game clock is
    // currently paused (banked into activeSeconds); non-null means the
    // clock is running and elapsed = activeSeconds + (now - lastResumedAt).
    @Column(name = "last_resumed_at")
    private LocalDateTime lastResumedAt;

    @Column(name = "is_random_challenge", nullable = false)
    private Boolean isRandomChallenge;
}