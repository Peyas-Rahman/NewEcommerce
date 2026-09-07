using Ecommerce.Application.DTOs.FlashSales;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Ecommerce.Infrastructure.Services.FlashSales;

public class FlashSaleService : IFlashSaleService
{
    private readonly ApplicationDbContext _context;

    public FlashSaleService(ApplicationDbContext context) => _context = context;

    public async Task<IEnumerable<FlashSaleDto>> GetAllAsync(bool activeOnly = false)
    {
        var query = _context.FlashSales.AsNoTracking()
            .Where(x => !x.IsDeleted && x.Product.IsActive);
        if (activeOnly)
            query = query.Where(x => x.IsActive && x.EndsAt > DateTime.UtcNow);

        return await query.OrderBy(x => x.SortOrder).ThenBy(x => x.Id).Select(Map).ToListAsync();
    }

    public async Task<FlashSaleDto?> GetByIdAsync(int id) =>
        await _context.FlashSales.AsNoTracking()
            .Where(x => x.Id == id && !x.IsDeleted)
            .Select(Map)
            .FirstOrDefaultAsync();

    public async Task<FlashSaleDto> CreateAsync(CreateFlashSaleDto dto)
    {
        Validate(dto);
        var entity = new FlashSale { CreatedAt = DateTime.UtcNow, IsDeleted = false };
        await ApplyAsync(entity, dto);
        _context.FlashSales.Add(entity);
        await _context.SaveChangesAsync();
        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Flash sale was not created.");
    }

    public async Task<FlashSaleDto?> UpdateAsync(int id, CreateFlashSaleDto dto)
    {
        Validate(dto);
        var entity = await _context.FlashSales.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity is null) return null;
        await ApplyAsync(entity, dto);
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.FlashSales.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity is null) return false;
        entity.IsDeleted = true;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task ApplyAsync(FlashSale entity, CreateFlashSaleDto dto)
    {
        if (!await _context.Products.AnyAsync(x => x.Id == dto.ProductId && x.IsActive && !x.IsDeleted))
            throw new ArgumentException("Active product is required.");

        entity.ProductId = dto.ProductId;
        entity.SalePrice = dto.SalePrice;
        entity.EndsAt = dto.EndsAt.Kind == DateTimeKind.Utc ? dto.EndsAt : dto.EndsAt.ToUniversalTime();
        entity.IsActive = dto.IsActive;
        entity.SortOrder = dto.SortOrder;
    }

    private static void Validate(CreateFlashSaleDto dto)
    {
        if (dto.ProductId <= 0) throw new ArgumentException("Product is required.");
        if (dto.SalePrice <= 0) throw new ArgumentException("Sale price must be greater than zero.");
        if (dto.EndsAt <= DateTime.UtcNow) throw new ArgumentException("End time must be in the future.");
    }

    private static readonly Expression<Func<FlashSale, FlashSaleDto>> Map = x => new FlashSaleDto
    {
        Id = x.Id,
        ProductId = x.ProductId,
        ProductName = x.Product.Name,
        Slug = x.Product.Slug,
        ImageUrl = x.Product.Images.Where(image => image.IsPrimary).Select(image => image.ImageUrl).FirstOrDefault()
            ?? x.Product.Images.OrderBy(image => image.SortOrder).Select(image => image.ImageUrl).FirstOrDefault(),
        OriginalPrice = x.Product.Price,
        SalePrice = x.SalePrice,
        EndsAt = x.EndsAt,
        IsActive = x.IsActive,
        SortOrder = x.SortOrder,
    };
}
