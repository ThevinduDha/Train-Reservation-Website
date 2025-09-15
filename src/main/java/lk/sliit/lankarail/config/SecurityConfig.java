package lk.sliit.lankarail.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Permissive security config for development/demo.
 * Keeps the JWT classes in the project (so you can re-enable them later),
 * but allows all HTTP requests while you build the frontend and CRUDs.
 *
 * IMPORTANT: Do NOT use this configuration in production.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
