package it.unina.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller dedicated to handling keep-alive health pings.
 */
@RestController
@RequestMapping("/api/v1/ping")
public class PingController
{

    @GetMapping
    public ResponseEntity<String> ping()
    {
        return ResponseEntity.ok("pong");
    }
}