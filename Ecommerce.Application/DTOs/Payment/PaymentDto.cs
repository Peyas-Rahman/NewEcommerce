namespace Ecommerce.Application.DTOs.Payment;

public class PaymentDto
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public string PaymentMethod { get; set; }
        = string.Empty;

    public string PaymentStatus { get; set; }
        = string.Empty;

    public decimal Amount { get; set; }

    public string? TransactionId { get; set; }

    public string? PaymentGateway { get; set; }

    public DateTime? PaidAt { get; set; }

    public string? FailureReason { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }
}