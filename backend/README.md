# Backend

Spring Boot API for Road-To-Unina, built with Java 21.

**Stack:**
- Spring Boot 4.1 (Web MVC, Security, Data JPA, Validation)
- PostgreSQL (via Hibernate in `validate` mode — the schema is the source of truth, see `schema.sql` in the repo root)
- JWT authentication (`io.jsonwebtoken`)
- springdoc-openapi (Swagger UI)

## Prerequisites

- Java 21
- A running PostgreSQL instance with the schema from `../schema.sql` already applied
- `DB_PASSWORD` and `JWT_KEY` environment variables set (see root README for details on `JWT_KEY`)

> If you just want to run everything (including the database) without installing anything locally, use Docker instead — see the root [README.md](../README.md).

## Configuration

Connection settings live in `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/roadtounina
spring.datasource.username=postgres
spring.datasource.password=${DB_PASSWORD}
```

Adjust `spring.datasource.url` if your local PostgreSQL isn't running on the default host/port.

## Running locally

```bash
export DB_PASSWORD=your-local-db-password
export JWT_KEY=your-secret-key-at-least-32-chars

./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080`.

## API documentation

Once running, Swagger UI is available at: http://localhost:8080/swagger-ui.html


## Main endpoints

| Method | Path                     | Description                    |
|--------|--------------------------|---------------------------------|
| POST   | `/api/auth/register`    | Register a new user             |
| POST   | `/api/auth/login`       | Log in, returns a JWT           |
| GET    | `/api/wiki/search`      | Search Wikipedia pages          |
| GET    | `/api/wiki/random`      | Get a random Wikipedia page     |
| GET    | `/api/games/current`    | Get the player's ongoing game   |
| GET    | `/api/games/leaderboard`| Get the leaderboard             |
| GET    | `/api/games/{id}`       | Get details of a specific game  |
| POST   | `/api/games/{id}/moves` | Submit a move in a game         |

## Building a JAR

```bash
./mvnw clean package -DskipTests
```

The runnable JAR is produced in `target/`.

## Running tests

```bash
./mvnw test
```