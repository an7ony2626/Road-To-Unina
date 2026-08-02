package it.unina.demo.service.wiki;

public class WikiPageNotFoundException extends RuntimeException {

    public WikiPageNotFoundException(String title) {
        super("Wikipedia page not found: " + title);
    }
}