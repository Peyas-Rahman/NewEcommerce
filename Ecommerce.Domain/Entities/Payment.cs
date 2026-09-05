namespace Ecommerce.Domain.Entities;

public class Payment : BaseEntity
{
    public int OrderId { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = "Pending";

    public decimal Amount { get; set; }

    public string? TransactionId { get; set; }

    public string? PaymentGateway { get; set; }

    public DateTime? PaidAt { get; set; }

    public string? FailureReason { get; set; }

    public string? Notes { get; set; }

    // Navigation
    public Order Order { get; set; } = null!;
}