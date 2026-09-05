using Ecommerce.Application.DTOs.Brands;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.Brands;

public class BrandService : IBrandService
{
    private readonly ApplicationDbContext _context;

    public BrandService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BrandDto>> GetAllAsync()
    {
        return await _context.Brands
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => new BrandDto
            {
                Id = x.Id,
                Name = x.Name,
                Slug = x.Slug,
                Description = x.Description,
                LogoUrl = x.LogoUrl,
                IsActive = x.IsActive,
                SortOrder = x.SortOrder
            })
            .ToListAsync();
    }

    public async Task<BrandDto?> GetByIdAsync(int id)
    {
        return await _context.Brands
            .AsNoTracking()
            .Where(x => x.Id == id && !x.IsDeleted)
            .Select(x => new BrandDto
            {
                Id = x.Id,
                Name = x.Name,
                Slug = x.Slug,
                Description = x.Description,
                LogoUrl = x.LogoUrl,
                IsActive = x.IsActive,
                SortOrder = x.SortOrder
            })
            .FirstOrDefaultAsync();
    }

    public async Task<BrandDto> CreateAsync(CreateBrandDto dto)
    {
        var brand = new Brand
        {
            Name = dto.Name.Trim(),
            Slug = GenerateSlug(dto.Name),
            Description = dto.Description?.Trim(),
            LogoUrl = dto.LogoUrl?.Trim(),
            IsActive = dto.IsActive,
            SortOrder = dto.SortOrder,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        _context.Brands.Add(brand);

        await _context.SaveChangesAsync();

        return MapToDto(brand);
    }

    public async Task<BrandDto?> UpdateAsync(
        int id,
        UpdateBrandDto dto)
    {
        var brand = await _context.Brands
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

        if (brand is null)
            return null;

        brand.Name = dto.Name.Trim();
        brand.Slug = GenerateSlug(dto.Name);
        brand.Description = dto.Description?.Trim();
        brand.LogoUrl = dto.LogoUrl?.Trim();
        brand.IsActive = dto.IsActive;
        brand.SortOrder = dto.SortOrder;
        brand.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(brand);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var brand = await _context.Brands
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

        if (brand is null)
            return false;

        brand.IsDeleted = true;
        brand.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    private static BrandDto MapToDto(Brand brand)
    {
        return new BrandDto
        {
            Id = brand.Id,
            Name = brand.Name,
            Slug = brand.Slug,
            Description = brand.Description,
            LogoUrl = brand.LogoUrl,
            IsActive = brand.IsActive,
            SortOrder = brand.SortOrder
        };
    }

    private static string GenerateSlug(string name)
    {
        return name
            .Trim()
            .ToLowerInvariant()
            .Replace(" ", "-");
    }
}