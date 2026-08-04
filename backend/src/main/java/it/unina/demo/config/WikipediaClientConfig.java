package it.unina.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class WikipediaClientConfig {

    private static final String WIKIPEDIA_API_BASE_URL = "https://en.wikipedia.org/w/api.php";

    // Wikimedia's API etiquette requires a descriptive User-Agent with
    // contact info; requests without one get throttled or blocked.
    // TODO: replace with your real contact email before demoing.
    private static final String USER_AGENT =
            "WikiRaceUninaExam/1.0 (student project; contact: your-email@example.com)";

    // Injecting Boot's auto-configured RestClient.Builder (not calling
    // RestClient.builder() directly) so we keep Boot's default Jackson
    // message converters instead of redefining them.
    @Bean
    public RestClient wikipediaRestClient(RestClient.Builder builder) {
        return builder
                .baseUrl(WIKIPEDIA_API_BASE_URL)
                .defaultHeader("User-Agent", USER_AGENT)
                .build();
    }
}