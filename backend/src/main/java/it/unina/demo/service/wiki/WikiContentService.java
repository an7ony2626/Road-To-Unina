package it.unina.demo.service.wiki;

import java.util.List;

public interface WikiContentService {


    PageContent getPageContent(String title);

    String getRandomPageTitle();

    List<PageSearchResult> searchPages(String query);
}