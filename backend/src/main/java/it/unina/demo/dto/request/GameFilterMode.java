package it.unina.demo.dto.request;

// Query-param filter shared by GET /completed and GET /leaderboard.
// Spring binds this directly from ?mode=RANDOM (case-insensitive),
// no manual string parsing needed in the controller.
public enum GameFilterMode {
    ALL,
    RANDOM,
    CUSTOM;

    // The one place this enum's meaning gets translated into the
    // Game.isRandomChallenge filter used by the JPQL queries.
    public Boolean toIsRandomChallenge() {
        return switch (this) {
            case ALL -> null;
            case RANDOM -> true;
            case CUSTOM -> false;
        };
    }
}