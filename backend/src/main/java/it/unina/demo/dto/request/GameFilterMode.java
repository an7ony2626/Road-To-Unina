package it.unina.demo.dto.request;

public enum GameFilterMode {
    ALL,
    RANDOM,
    CUSTOM,
    UNINA;

    public static final String UNINA_TARGET_TITLE = "Università degli Studi di Napoli Federico II";


    public Boolean toIsRandomChallenge() {
        return switch (this) {
            case ALL, UNINA -> null;
            case RANDOM -> true;
            case CUSTOM -> false;
        };
    }

    public String toRequiredTargetTitle() {
        return this == UNINA ? UNINA_TARGET_TITLE : null;
    }
}