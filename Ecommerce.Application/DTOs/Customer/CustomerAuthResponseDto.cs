namespace Ecommerce.Application.DTOs.Customer;

public class CustomerAuthResponseDto
{
    public int CustomerId { get; set; }

    public string FirstName { get; set; }
        = string.Empty;

    public string? LastName { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public string Token { get; set; }
        = string.Empty;

    public bool IsTwoFactorRequired { get; set; }
}