package it.unina.demo.service.wiki;

public interface WikiContentService {

    // title may be an alias/redirect; the returned PageContent.title()
    // is the canonical resolved title, which GameService should persist
    // and compare against (not the title the caller passed in).
    PageContent getPageContent(String title);

    // Used to pick random start/target pages when a game starts.
    // Namespace 0 = main article namespace, same filter used elsewhere.
    String getRandomPageTitle();
}