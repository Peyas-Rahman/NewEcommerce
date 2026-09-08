namespace Ecommerce.Application.DTOs.Coupons;

public class CouponValidationResultDto
{
    public string Code { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public decimal SubTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public string Message { get; set; } = string.Empty;
}
