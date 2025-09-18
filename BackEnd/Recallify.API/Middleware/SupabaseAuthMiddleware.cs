using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace NotesWise.API.Middleware;

public class SupabaseAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _supabaseJwtSecret;

    public SupabaseAuthMiddleware(RequestDelegate next, IConfiguration configuration)
    {
        _next = next;
        _supabaseJwtSecret = configuration["Supabase:JwtSecret"] ?? throw new InvalidOperationException("Supabase JWT Secret not configured");
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var token = ExtractBearerToken(context.Request);
        if (!string.IsNullOrEmpty(token))
        {
            var userId = ValidateSupabaseToken(token);
            if (!string.IsNullOrEmpty(userId))
            {
                context.Items["UserId"] = userId;

                //Adicionando Claims para o acesso
                var claims = new List<Claim>
                {
                    new("sub", userId),
                    new("user_id", userId)
                };

                var identity = new ClaimsIdentity(claims, "Supabase");
                context.User = new ClaimsPrincipal(identity);
            }
        }

        await _next(context);
    }

    private static string? ExtractBearerToken(HttpRequest request)
    {
        var authorizationHeader = request.Headers.Authorization.FirstOrDefault();
        if (authorizationHeader?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true)
        {
            return authorizationHeader["Bearer ".Length..].Trim();
        }
        return null;
    }

    private string? ValidateSupabaseToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();

            // Configura os parâmetros de validação usando o secret JWT do Supabase
            tokenHandler.MapInboundClaims = false;
            tokenHandler.InboundClaimTypeMap.Clear();
            tokenHandler.OutboundClaimTypeMap.Clear();

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_supabaseJwtSecret)),
                ValidateIssuer = true,
                ValidIssuer = "https://tybjkxyebirmzkuxtiuh.supabase.co/auth/v1",
                ValidateAudience = true,
                ValidAudience = "authenticated",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(5) // permite um pequeno atraso na validação do tempo
            };
       
            var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);

            // Extrai o ID do usuário do claim 'sub'
            var userId =
                principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ??
                principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                (validatedToken as JwtSecurityToken)?.Subject;

            if (string.IsNullOrEmpty(userId))
            {
                return null;
            }

            return userId;
        }
        catch (SecurityTokenExpiredException ex)
        {
            Console.WriteLine($"[AUTH] Expired token: {ex.Message}");
            return null;
        }
        catch (SecurityTokenInvalidSignatureException ex)
        {
            Console.WriteLine($"[AUTH] Invalid signature: {ex.Message}");
            return null;
        }
        catch (SecurityTokenValidationException ex)
        {
            Console.WriteLine($"[AUTH] Token validation failed: {ex.Message}");
            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AUTH] Unexpected error while validating token: {ex.Message}");
            return null;
        }
    }
}

// Método de extensão para facilitar o registro do middleware
public static class SupabaseAuthMiddlewareExtensions
{
    public static IApplicationBuilder UseSupabaseAuth(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SupabaseAuthMiddleware>();
    }
}