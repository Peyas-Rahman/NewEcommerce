namespace Ecommerce.Application.DTOs.Payment;

public class UpdatePaymentStatusDto
{
    public string PaymentStatus { get; set; }
        = string.Empty;

    public string? TransactionId { get; set; }

    public string? FailureReason { get; set; }

    public string? Notes { get; set; }
}