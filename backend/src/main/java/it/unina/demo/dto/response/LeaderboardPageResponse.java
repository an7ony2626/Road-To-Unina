package it.unina.demo.dto.response;

import java.util.List;

public record LeaderboardPageResponse(
        List<LeaderboardEntryResponse> entries,
        boolean hasMore,
        Integer currentUserRank
) {
}