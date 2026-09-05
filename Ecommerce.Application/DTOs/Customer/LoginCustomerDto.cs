using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Application.DTOs.Customer;

public class LoginCustomerDto
{
    // Email OR Phone
    [Required]
    public string Login { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}