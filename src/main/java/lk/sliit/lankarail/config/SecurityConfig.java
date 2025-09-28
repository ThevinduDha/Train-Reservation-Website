package lk.sliit.lankarail.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // disable CSRF for easier REST testing (enable/adjust in production)
                .csrf(csrf -> csrf.disable())

                // permit static assets and auth endpoints
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/css/**", "/js/**", "/images/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()     // your JSON register/login endpoints
                        .requestMatchers("/login.html", "/signup.html", "/", "/index.html", "/admin.html").permitAll() // allow admin html to be served publicly
                        // admin APIs require ADMIN role (keep API endpoints protected)
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // everything else requires authentication
                        .anyRequest().authenticated()
                )

                // When an unauthenticated user tries to access a protected page, redirect
                // to your custom login page (NOT Spring's default /login).
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(new LoginUrlAuthenticationEntryPoint("/login.html"))
                );

        // Note: your AuthController handles /api/auth/login and sets the session. No formLogin() needed here.

        return http.build();
    }

    // expose AuthenticationManager (used by your AuthController)
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // password encoder for registering users
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
