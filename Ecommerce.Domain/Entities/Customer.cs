namespace Ecommerce.Domain.Entities;

public class Customer : BaseEntity
{
    // =========================================================
    // Basic Information
    // =========================================================

    public string FirstName { get; set; } = string.Empty;

    public string? LastName { get; set; }

    // =========================================================
    // Login Information
    // =========================================================

    // Customer can login using Email OR Phone
    public string? Phone { get; set; }

    public string? Email { get; set; }

    // =========================================================
    // Authentication
    // =========================================================

    public string? PasswordHash { get; set; }

    // =========================================================
    // Verification
    // =========================================================

    public bool IsEmailVerified { get; set; }

    public bool IsPhoneVerified { get; set; }

    // =========================================================
    // Two Factor Authentication
    // =========================================================

    public bool IsTwoFactorEnabled { get; set; }

    // =========================================================
    // Account Status
    // =========================================================

    public bool IsActive { get; set; } = true;

    // =========================================================
    // Orders
    // =========================================================

    public ICollection<Order> Orders { get; set; }
        = new List<Order>();

    public ICollection<CustomerAddress> Addresses { get; set; }
    = new List<CustomerAddress>();
}