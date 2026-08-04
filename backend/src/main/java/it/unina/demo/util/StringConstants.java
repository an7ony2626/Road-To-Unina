package it.unina.demo.util;

// Centralized user-facing error messages, kept in one place so
// service layer and exception handler agree on the same wording.
public final class StringConstants {

    private StringConstants() {
    }

    public static final String INVALID_CREDENTIALS_MESSAGE = "Invalid username or password";
    public static final String USERNAME_TAKEN_MESSAGE = "Username is already taken";
    public static final String EMAIL_TAKEN_MESSAGE = "Email is already registered";
    public static final String USER_NOT_FOUND_MESSAGE = "User not found";
}