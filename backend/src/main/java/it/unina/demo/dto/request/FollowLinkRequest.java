package it.unina.demo.dto.request;

import jakarta.validation.constraints.NotBlank;

public record FollowLinkRequest(
        @NotBlank String clickedTitle
) {
}