using Ecommerce.Application.DTOs.Coupons;

namespace Ecommerce.Application.Interfaces.Services;

public interface ICouponService
{
    Task<CouponDto> CreateAsync(CreateCouponDto dto);
    Task<CouponValidationResultDto> ValidateAsync(CouponValidationDto dto);

    Task<IEnumerable<CouponDto>> GetAllAsync();

    Task<CouponDto?> UpdateAsync(int id, CreateCouponDto dto);

    Task<bool> DeleteAsync(int id);
}
