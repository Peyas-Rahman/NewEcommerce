namespace Ecommerce.Domain.Entities;

public class CustomerAddress : BaseEntity
{
    public int CustomerId { get; set; }

    public string AddressType { get; set; } = "Home";

    public string FullName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string AddressLine { get; set; } = string.Empty;

    public string? City { get; set; }

    public string? Area { get; set; }

    public string? PostalCode { get; set; }

    public bool IsDefault { get; set; } = false;

    public Customer Customer { get; set; } = null!;
}