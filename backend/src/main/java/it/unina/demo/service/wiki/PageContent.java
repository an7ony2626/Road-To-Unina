package it.unina.demo.service.wiki;

import java.util.List;

// Implementation-agnostic model: "content" is deliberately not called
// "extract" here, so GameService never has to know whether it came from
// MediaWiki's prop=extracts or from a Jsoup-parsed HTML page later.
public record PageContent(
        String title,
        String content,
        List<String> linkTitles
) {
}