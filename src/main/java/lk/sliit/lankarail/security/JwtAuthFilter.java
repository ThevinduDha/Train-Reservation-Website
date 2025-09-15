package lk.sliit.lankarail.security;

import lk.sliit.lankarail.impl.UserDetailsServiceImpl; // adjust if your class is in a different package
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserDetailsServiceImpl userDetailsService;

    public JwtAuthFilter(JwtUtils jwtUtils, UserDetailsServiceImpl userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        System.out.println(">>> JwtAuthFilter: Authorization header = " + header);

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            System.out.println(">>> JwtAuthFilter: token length = " + token.length());
            try {
                if (jwtUtils.validateJwtToken(token)) {
                    String username = jwtUtils.getUserNameFromJwtToken(token);
                    System.out.println(">>> JwtAuthFilter: username from token = " + username);

                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    System.out.println(">>> JwtAuthFilter: loaded user = " + userDetails.getUsername());

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    System.out.println(">>> JwtAuthFilter: authentication set in SecurityContext");
                } else {
                    System.out.println(">>> JwtAuthFilter: token failed validation");
                }
            } catch (Exception ex) {
                System.out.println(">>> JwtAuthFilter: exception = " + ex.getMessage());
            }
        } else {
            System.out.println(">>> JwtAuthFilter: no Bearer token found");
        }

        filterChain.doFilter(request, response);
    }
}

