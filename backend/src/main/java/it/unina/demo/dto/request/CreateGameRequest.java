package it.unina.demo.dto.request;

public record CreateGameRequest(
        String startPageTitle,
        String targetPageTitle,
        Boolean startWasRandom,
        Boolean targetWasRandom,
        Boolean confirmReplaceExisting
) {
}