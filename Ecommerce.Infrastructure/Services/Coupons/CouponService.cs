using Ecommerce.Application.DTOs.Coupons;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.Coupons;

public class CouponService : ICouponService
{
    private readonly ApplicationDbContext _context;
    public CouponService(ApplicationDbContext context) => _context = context;

    public async Task<CouponDto> CreateAsync(CreateCouponDto dto)
    {
        var code = dto.Code.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code)) throw new ArgumentException("Coupon code is required.");
        if (dto.DiscountType is not ("Percentage" or "Fixed")) throw new ArgumentException("Discount type must be Percentage or Fixed.");
        if (dto.DiscountValue <= 0) throw new ArgumentException("Discount value must be greater than zero.");
        if (dto.DiscountType == "Percentage" && dto.DiscountValue > 100) throw new ArgumentException("Percentage discount cannot exceed 100.");
        if (await _context.Coupons.AnyAsync(x => x.Code == code && !x.IsDeleted)) throw new ArgumentException("Coupon code already exists.");

        var coupon = new Coupon { Code = code, DiscountType = dto.DiscountType, DiscountValue = dto.DiscountValue, MinimumOrderAmount = dto.MinimumOrderAmount, MaximumDiscountAmount = dto.MaximumDiscountAmount, UsageLimit = dto.UsageLimit, StartsAt = dto.StartsAt, ExpiresAt = dto.ExpiresAt, IsActive = dto.IsActive, CreatedAt = DateTime.UtcNow, IsDeleted = false };
        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync();
        return Map(coupon);
    }

    public async Task<CouponValidationResultDto> ValidateAsync(CouponValidationDto dto)
    {
        if (dto.SubTotal < 0) throw new ArgumentException("Invalid subtotal.");
        var code = dto.Code.Trim().ToUpperInvariant();
        var coupon = await _context.Coupons.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code && x.IsActive && !x.IsDeleted);
        var discount = Calculate(coupon, dto.SubTotal);
        return new CouponValidationResultDto { Code = code, DiscountAmount = discount, SubTotal = dto.SubTotal, GrandTotal = Math.Max(0, dto.SubTotal - discount), Message = "Coupon applied successfully." };
    }

    public static decimal Calculate(Coupon? coupon, decimal subTotal)
    {
        if (coupon is null) throw new ArgumentException("Invalid or inactive coupon code.");
        var now = DateTime.UtcNow;
        if (coupon.StartsAt.HasValue && now < coupon.StartsAt.Value) throw new ArgumentException("This coupon is not active yet.");
        if (coupon.ExpiresAt.HasValue && now > coupon.ExpiresAt.Value) throw new ArgumentException("This coupon has expired.");
        if (coupon.UsageLimit.HasValue && coupon.UsedCount >= coupon.UsageLimit.Value) throw new ArgumentException("This coupon usage limit has been reached.");
        if (coupon.MinimumOrderAmount.HasValue && subTotal < coupon.MinimumOrderAmount.Value) throw new ArgumentException($"Minimum order amount is ৳{coupon.MinimumOrderAmount.Value:0.##}.");
        var discount = coupon.DiscountType == "Percentage" ? subTotal * coupon.DiscountValue / 100 : coupon.DiscountValue;
        if (coupon.MaximumDiscountAmount.HasValue) discount = Math.Min(discount, coupon.MaximumDiscountAmount.Value);
        return Math.Round(Math.Min(discount, subTotal), 2);
    }

    public async Task<IEnumerable<CouponDto>> GetAllAsync()
    {
        return await _context.Coupons
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderByDescending(x => x.Id)
            .Select(x => Map(x))
            .ToListAsync();
    }

    public async Task<CouponDto?> UpdateAsync(int id, CreateCouponDto dto)
    {
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

        if (coupon is null) return null;

        var code = dto.Code.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code)) throw new ArgumentException("Coupon code is required.");
        if (dto.DiscountType is not ("Percentage" or "Fixed")) throw new ArgumentException("Discount type must be Percentage or Fixed.");
        if (dto.DiscountValue <= 0) throw new ArgumentException("Discount value must be greater than zero.");
        if (dto.DiscountType == "Percentage" && dto.DiscountValue > 100) throw new ArgumentException("Percentage discount cannot exceed 100.");
        if (await _context.Coupons.AnyAsync(x => x.Code == code && x.Id != id && !x.IsDeleted)) throw new ArgumentException("Coupon code already exists.");

        coupon.Code = code;
        coupon.DiscountType = dto.DiscountType;
        coupon.DiscountValue = dto.DiscountValue;
        coupon.MinimumOrderAmount = dto.MinimumOrderAmount;
        coupon.MaximumDiscountAmount = dto.MaximumDiscountAmount;
        coupon.UsageLimit = dto.UsageLimit;
        coupon.StartsAt = dto.StartsAt;
        coupon.ExpiresAt = dto.ExpiresAt;
        coupon.IsActive = dto.IsActive;
        coupon.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Map(coupon);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

        if (coupon is null) return false;

        coupon.IsDeleted = true;
        coupon.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    private static CouponDto Map(Coupon x) => new() { Id = x.Id, Code = x.Code, DiscountType = x.DiscountType, DiscountValue = x.DiscountValue, MinimumOrderAmount = x.MinimumOrderAmount, MaximumDiscountAmount = x.MaximumDiscountAmount, UsageLimit = x.UsageLimit, UsedCount = x.UsedCount, StartsAt = x.StartsAt, ExpiresAt = x.ExpiresAt, IsActive = x.IsActive };
}
