namespace Ecommerce.Application.Interfaces.Services;

public interface IJwtTokenService
{
    string GenerateToken(
        int customerId,
        string? email,
        string? phone,
        string firstName);
}