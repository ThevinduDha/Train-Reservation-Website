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
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // 1. Static Assets (Public) - Must be first
                        .requestMatchers("/css/**", "/js/**", "/images/**", "/favicon.ico").permitAll()

                        // 2. Public API Endpoints (Login/Register + Public Data)
                        .requestMatchers("/api/auth/**", "/api/schedules", "/api/trains", "/api/stations").permitAll()

                        // 3. Public Pages (HTML served by ViewController)
                        .requestMatchers("/", "/login", "/signup", "/admin").permitAll()

                        // 4. Admin API & Pages (Requires ADMIN Role)
                        .requestMatchers("/admin/dashboard", "/api/admin/**").hasRole("ADMIN")

                        // 5. Passenger Page & Ticket Page (Requires Authentication)
                        .requestMatchers("/passenger/dashboard", "/ticket").authenticated()

                        // 6. ALL OTHER /api/** endpoints require authentication
                        // This covers /api/users/me, /api/bookings/**, etc.
                        .requestMatchers("/api/**").authenticated()

                        // 7. Any other request requires authentication (Fallback)
                        .anyRequest().authenticated()
                )
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(new LoginUrlAuthenticationEntryPoint("/login"))
                )
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .permitAll()
                );

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}