package it.unina.demo.service.wiki;

import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Full implementation of WikiContentService: fetches the real rendered
 * article HTML via MediaWiki's action=parse, and uses jsoup to extract
 * both the cleaned HTML (for display) and the list of valid outgoing
 * links (for move validation) directly from the same markup — no
 * separate prop=links call needed, the HTML is the single source of
 * truth for "what's a clickable link on this page".
 *
 * Known simplification: no CSS is attached here (that's a frontend
 * concern — linking Wikipedia's real stylesheet, or styling our own).
 * This service only guarantees correct content and correct links.
 */
@Service
@RequiredArgsConstructor
public class MediaWikiContentService implements WikiContentService {

    private final RestClient wikipediaRestClient;

    @Override
    public PageContent getPageContent(String title) {
        JsonNode response = wikipediaRestClient.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("action", "parse")
                        .queryParam("format", "json")
                        .queryParam("prop", "text")
                        .queryParam("redirects", "1")
                        .queryParam("page", title)
                        .build())
                .retrieve()
                .body(JsonNode.class);

        JsonNode parseNode = response.get("parse");

        if (parseNode == null)
            throw new WikiPageNotFoundException(title);

        String resolvedTitle = parseNode.get("title").asString();
        String rawHtml = parseNode.path("text").path("*").asString("");

        Document document = Jsoup.parse(rawHtml);
        stripNonContentElements(document);

        Set<String> linkTitles = extractMainspaceLinkTitles(document);
        rewriteImageSources(document);

        return new PageContent(resolvedTitle, document.body().html(), new ArrayList<>(linkTitles));
    }

    @Override
    public String getRandomPageTitle() {
        JsonNode response = wikipediaRestClient.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("action", "query")
                        .queryParam("format", "json")
                        .queryParam("list", "random")
                        .queryParam("rnnamespace", "0")
                        .queryParam("rnfilterredir", "nonredirects")
                        .queryParam("rnminsize", "1000")
                        .queryParam("rnlimit", "1")
                        .build())
                .retrieve()
                .body(JsonNode.class);

        return response.path("query").path("random").get(0).get("title").asString();
    }

    // Edit-section pencils and reference-list "cite" backlinks are noise
    // for a reading UI and would otherwise show up as extra clickable
    // links; categories/templates/files are non-article namespaces and
    // can never be valid moves anyway.
    private void stripNonContentElements(Document document) {
        document.select("span.mw-editsection, sup.reference, .navbox, .metadata, style, script")
                .remove();
    }

    private Set<String> extractMainspaceLinkTitles(Document document) {
        Set<String> titles = new LinkedHashSet<>();
        Elements links = document.select("a[href^=/wiki/]");

        for (Element link : links) {
            String href = link.attr("href");
            String encodedTitle = href.substring("/wiki/".length());

            // Skip non-mainspace links (Category:, File:, Template:,
            // Help:, Special:, Wikipedia:, Talk:, etc.) and in-page
            // anchors on the article itself (href="/wiki/Title#Section").
            if (encodedTitle.contains(":") || encodedTitle.isBlank())
                continue;

            String decodedTitle = URLDecoder.decode(encodedTitle.split("#")[0], StandardCharsets.UTF_8)
                    .replace('_', ' ');

            titles.add(decodedTitle);
        }

        return titles;
    }

    // MediaWiki emits protocol-relative image URLs (//upload.wikimedia.org/...),
    // which resolve fine in a real browser but not when injected via
    // Angular's [innerHTML] outside of a browsing context tied to a URL scheme.
    private void rewriteImageSources(Document document) {
        for (Element img : document.select("img[src^=//]")) {
            img.attr("src", "https:" + img.attr("src"));
        }
    }
}