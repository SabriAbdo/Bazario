package com.bazario.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JwtConfig {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    public String getSecret() { return secret; }
    public long getAccessTokenExpirationMs() { return accessTokenExpirationMs; }
}
