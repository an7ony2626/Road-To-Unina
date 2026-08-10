package it.unina.demo.dto.response;

import java.util.List;

// A single page of the completed-games history. "hasMore" tells the
// frontend whether to show the "carica altre" control, without the
// client having to guess from games().size() == size requested.
public record CompletedGamesPageResponse(
        List<CompletedGameSummaryResponse> games,
        boolean hasMore
) {
}