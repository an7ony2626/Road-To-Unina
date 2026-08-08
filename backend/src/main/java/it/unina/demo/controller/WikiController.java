// controller/WikiController.java
package it.unina.demo.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import it.unina.demo.dto.response.WikiSearchResultResponse;
import it.unina.demo.service.wiki.WikiContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Public: picking a start/target page happens before a game (and thus
// before any auth check) even exists, so this can't require a token.
@RestController
@RequestMapping("/api/wiki")
@RequiredArgsConstructor
@SecurityRequirements
public class WikiController {

    private final WikiContentService wikiContentService;

    @GetMapping("/search")
    public List<WikiSearchResultResponse> search(@RequestParam("q") String query) {
        return wikiContentService.searchPages(query).stream()
                .map(r -> new WikiSearchResultResponse(r.title(), r.thumbnailUrl(), r.extract()))
                .toList();
    }
}