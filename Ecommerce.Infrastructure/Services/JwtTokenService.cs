using Ecommerce.Application.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Ecommerce.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(
        IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(
        int customerId,
        string? email,
        string? phone,
        string firstName)
    {
        var key =
            _configuration["Jwt:Key"];

        var issuer =
            _configuration["Jwt:Issuer"];

        var audience =
            _configuration["Jwt:Audience"];

        if (string.IsNullOrWhiteSpace(key))
        {
            throw new InvalidOperationException(
                "JWT Key is not configured.");
        }

        var claims = new List<Claim>
        {
            new(
                ClaimTypes.NameIdentifier,
                customerId.ToString()),

            new(
                ClaimTypes.Name,
                firstName),

            new(
                "customerId",
                customerId.ToString())
        };

        if (!string.IsNullOrWhiteSpace(email))
        {
            claims.Add(
                new Claim(
                    ClaimTypes.Email,
                    email));
        }

        if (!string.IsNullOrWhiteSpace(phone))
        {
            claims.Add(
                new Claim(
                    "phone",
                    phone));
        }

        var securityKey =
            new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(key));

        var credentials =
            new SigningCredentials(
                securityKey,
                SecurityAlgorithms.HmacSha256);

        var token =
            new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials);

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }
}