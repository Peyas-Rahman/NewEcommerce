namespace Ecommerce.Application.DTOs.Payment;

public class CreatePaymentDto
{
    public int OrderId { get; set; }

    public string PaymentMethod { get; set; }
        = string.Empty;

    public decimal Amount { get; set; }

    public string? TransactionId { get; set; }

    public string? PaymentGateway { get; set; }

    public string? Notes { get; set; }
}