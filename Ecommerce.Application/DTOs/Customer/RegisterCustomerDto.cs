using System.ComponentModel.DataAnnotations;

namespace Ecommerce.Application.DTOs.Customer;

public class RegisterCustomerDto
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? LastName { get; set; }

    // Email OR Phone — at least one is required.
    [EmailAddress]
    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [Required]
    [MinLength(6)]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;
}