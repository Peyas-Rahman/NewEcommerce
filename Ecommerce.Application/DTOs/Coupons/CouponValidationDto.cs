namespace Ecommerce.Application.DTOs.Coupons;

public class CouponValidationDto
{
    public string Code { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
}
