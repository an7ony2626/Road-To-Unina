package it.unina.demo.service.wiki;

import tools.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriBuilder;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Light implementation of WikiContentService: uses MediaWiki's
 * prop=extracts (plain text, explaintext=1) combined with prop=links
 * in a single query, so a page's content and its outgoing links come
 * back together. redirects=1 lets Wikipedia resolve aliases (e.g.
 * "USA" -> "United States") on the server side.
 *
 * Known simplification: links are capped at MAX_LINK_PAGES batches via
 * plcontinue pagination, instead of following continuation forever.
 * This is a deliberate light-implementation tradeoff, not an oversight.
 */
@Service
@RequiredArgsConstructor
public class MediaWikiContentService implements WikiContentService {

    private static final int MAX_LINK_PAGES = 10; // 10 * 500 = 5000 links max per page

    private final RestClient wikipediaRestClient;

    @Override
    public PageContent getPageContent(String title) {
        JsonNode response = queryPage(title, null);
        JsonNode pageNode = extractPageNode(response, title);

        String resolvedTitle = pageNode.get("title").asString();
        String content = pageNode.path("extract").asString("");

        List<String> linkTitles = new ArrayList<>();
        collectLinks(pageNode, linkTitles);

        JsonNode continueNode = response.get("continue");
        int pagesFetched = 1;

        while (continueNode != null && pagesFetched < MAX_LINK_PAGES) {
            String plContinue = continueNode.get("plcontinue").asString();
            JsonNode nextResponse = queryPage(title, plContinue);
            collectLinks(extractPageNode(nextResponse, title), linkTitles);
            continueNode = nextResponse.get("continue");
            pagesFetched++;
        }

        return new PageContent(resolvedTitle, content, linkTitles);
    }

    @Override
    public String getRandomPageTitle() {
        JsonNode response = wikipediaRestClient.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("action", "query")
                        .queryParam("format", "json")
                        .queryParam("list", "random")
                        .queryParam("rnnamespace", "0")
                        .queryParam("rnlimit", "1")
                        .build())
                .retrieve()
                .body(JsonNode.class);

        return response.path("query").path("random").get(0).get("title").asString();
    }
            
    private JsonNode queryPage(String title, String plContinue) {
        return wikipediaRestClient.get()
                .uri(uriBuilder -> buildQueryUri(uriBuilder, title, plContinue))
                .retrieve()
                .body(JsonNode.class);
    }

    private java.net.URI buildQueryUri(UriBuilder uriBuilder, String title, String plContinue) {
        UriBuilder builder = uriBuilder
                .queryParam("action", "query")
                .queryParam("format", "json")
                .queryParam("prop", "extracts|links")
                .queryParam("explaintext", "1")
                .queryParam("exlimit", "1")
                .queryParam("redirects", "1")
                .queryParam("plnamespace", "0") // only links to main-namespace articles
                .queryParam("pllimit", "max")
                .queryParam("titles", title);

        if (plContinue != null)
            builder = builder.queryParam("plcontinue", plContinue);

        return builder.build();
    }

    private JsonNode extractPageNode(JsonNode response, String title) {
        Collection<JsonNode> pages = response.path("query").path("pages").values();

        if (pages.isEmpty())
            throw new WikiPageNotFoundException(title);

        JsonNode pageNode = pages.iterator().next();

        if (pageNode.has("missing"))
            throw new WikiPageNotFoundException(title);

        return pageNode;
    }

    private void collectLinks(JsonNode pageNode, List<String> linkTitles) {
        for (JsonNode link : pageNode.path("links")) {
            linkTitles.add(link.get("title").asString());
        }
    }
}