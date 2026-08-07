package it.unina.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class WikipediaClientConfig {

    private static final String WIKIPEDIA_API_BASE_URL = "https://it.wikipedia.org/w/api.php";

    // Without explicit timeouts, a stalled or unreachable host hangs the
    // request indefinitely instead of failing fast — which then hangs
    // every endpoint that touches wiki content (getCurrentGame,
    // followLink, createGame).
    private static final int CONNECT_TIMEOUT_MS = 5_000;
    private static final int READ_TIMEOUT_MS = 8_000;

    // Wikimedia's API etiquette requires a descriptive User-Agent with
    // contact info; requests without one get throttled or blocked.
    private static final String USER_AGENT =
            "WikiRaceUninaExam/1.0 (student project; contact: an7ony26@gmail.com)";

    @Bean
    public RestClient wikipediaRestClient(RestClient.Builder builder) {
        return builder
                .baseUrl(WIKIPEDIA_API_BASE_URL)
                .defaultHeader("User-Agent", USER_AGENT)
                .requestFactory(wikipediaRequestFactory())
                .build();
    }

    private ClientHttpRequestFactory wikipediaRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return factory;
    }
}