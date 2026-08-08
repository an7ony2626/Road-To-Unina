// dto/request/CreateGameRequest.java
package it.unina.demo.dto.request;

// Both fields optional: null/blank means "pick randomly for me". A
// title the user explicitly picked is never silently swapped out —
// only the side left to chance gets re-rolled on a collision.
public record CreateGameRequest(
        String startPageTitle,
        String targetPageTitle
) {
}