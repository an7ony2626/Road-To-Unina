package it.unina.demo.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig
{

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain
    (HttpSecurity http) throws Exception
    {
        http
                .cors
                (cors -> cors.configurationSource
                (corsConfigurationSource
                ()))
                .csrf
                (csrf -> csrf.disable
                ())
                .authorizeHttpRequests
                (auth -> auth
                        .requestMatchers
                        ("/api/auth/**").permitAll
                        ()
                        .requestMatchers
                        ("/api/v1/ping").permitAll
                        ()
                        .requestMatchers
                        (HttpMethod.GET, "/api/games/leaderboard").permitAll
                        ()
                        .requestMatchers
                        (HttpMethod.GET, "/api/games/completed").permitAll
                        ()
                        .requestMatchers
                        (HttpMethod.GET, "/api/games/completed/{id}").permitAll
                        ()
                        .requestMatchers
                        ("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll
                        ()
                        
                        .anyRequest
                        ().authenticated
                        ()
                )
                .sessionManagement
                (session -> session
                        .sessionCreationPolicy
                        (SessionCreationPolicy.STATELESS))
                .authenticationProvider
                (authenticationProvider)
                .addFilterBefore
                (jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build
        ();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource
    ()
    {
        CorsConfiguration configuration = new CorsConfiguration
        ();
        configuration.setAllowedOrigins
        (List.of
        (allowedOrigins.split
        (",")));
        configuration.setAllowedMethods
        (List.of
        ("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders
        (List.of
        ("*"));
        configuration.setAllowCredentials
        (true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource
        ();
        source.registerCorsConfiguration
        ("/**", configuration);
        return source;
    }
}