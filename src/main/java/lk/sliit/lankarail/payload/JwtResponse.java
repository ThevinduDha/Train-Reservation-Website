package lk.sliit.lankarail.payload;

public class JwtResponse {
    private String token;
    private String tokenType = "Bearer";
    private Long id;
    private String email;
    private String role;

    public JwtResponse(String token, Long id, String email, String role) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.role = role;
    }

    public String getToken() { return token; }
    public String getTokenType() { return tokenType; }
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
}
