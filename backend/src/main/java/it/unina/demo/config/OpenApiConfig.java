package it.unina.demo.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

// Declares the "Authorize" button in Swagger UI: paste a raw JWT (no
// "Bearer " prefix needed, springdoc adds it) and it's sent on every
// subsequent request from the UI.
@Configuration
@OpenAPIDefinition(info = @Info(title = "WikiRace API", version = "1.0"))
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)
public class OpenApiConfig {
}