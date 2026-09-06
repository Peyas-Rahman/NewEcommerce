using Ecommerce.Application.DTOs.HomepageSliders;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Ecommerce.Infrastructure.Services.HomepageSliders;

public class HomepageSliderService : IHomepageSliderService
{
    private readonly ApplicationDbContext _context;

    public HomepageSliderService(ApplicationDbContext context) => _context = context;

    public async Task<IEnumerable<HomepageSliderDto>> GetAllAsync(bool activeOnly = false)
    {
        var query = _context.HomepageSliders.AsNoTracking().Where(x => !x.IsDeleted);
        if (activeOnly) query = query.Where(x => x.IsActive);
        return await query.OrderBy(x => x.SortOrder).ThenBy(x => x.Id).Select(Map).ToListAsync();
    }

    public async Task<HomepageSliderDto?> GetByIdAsync(int id) => await _context.HomepageSliders.AsNoTracking().Where(x => x.Id == id && !x.IsDeleted).Select(Map).FirstOrDefaultAsync();

    public async Task<HomepageSliderDto> CreateAsync(CreateHomepageSliderDto dto)
    {
        Validate(dto);
        var entity = new HomepageSlider { CreatedAt = DateTime.UtcNow, IsDeleted = false };
        Apply(entity, dto);
        _context.HomepageSliders.Add(entity);
        await _context.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<HomepageSliderDto?> UpdateAsync(int id, CreateHomepageSliderDto dto)
    {
        Validate(dto);
        var entity = await _context.HomepageSliders.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity is null) return null;
        Apply(entity, dto);
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.HomepageSliders.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity is null) return false;
        entity.IsDeleted = true;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    private static void Validate(CreateHomepageSliderDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ImageUrl)) throw new ArgumentException("Slider image is required.");
        if (string.IsNullOrWhiteSpace(dto.Title)) throw new ArgumentException("Slider title is required.");
    }

    private static void Apply(HomepageSlider entity, CreateHomepageSliderDto dto)
    {
        entity.ImageUrl = dto.ImageUrl.Trim(); entity.Badge = dto.Badge?.Trim() ?? ""; entity.Eyebrow = dto.Eyebrow?.Trim() ?? "";
        entity.Title = dto.Title.Trim(); entity.Highlight = dto.Highlight?.Trim() ?? ""; entity.Description = dto.Description?.Trim() ?? "";
        entity.PrimaryButtonText = dto.PrimaryButtonText?.Trim() ?? ""; entity.PrimaryButtonUrl = string.IsNullOrWhiteSpace(dto.PrimaryButtonUrl) ? "/shop" : dto.PrimaryButtonUrl.Trim();
        entity.SecondaryButtonText = dto.SecondaryButtonText?.Trim() ?? ""; entity.SecondaryButtonUrl = string.IsNullOrWhiteSpace(dto.SecondaryButtonUrl) ? "/shop" : dto.SecondaryButtonUrl.Trim();
        entity.SortOrder = dto.SortOrder; entity.IsActive = dto.IsActive;
    }

    private static readonly Expression<Func<HomepageSlider, HomepageSliderDto>> Map = x => new HomepageSliderDto
    {
        Id = x.Id, ImageUrl = x.ImageUrl, Badge = x.Badge, Eyebrow = x.Eyebrow, Title = x.Title, Highlight = x.Highlight,
        Description = x.Description, PrimaryButtonText = x.PrimaryButtonText, PrimaryButtonUrl = x.PrimaryButtonUrl,
        SecondaryButtonText = x.SecondaryButtonText, SecondaryButtonUrl = x.SecondaryButtonUrl, SortOrder = x.SortOrder, IsActive = x.IsActive
    };

    private static HomepageSliderDto MapToDto(HomepageSlider x) => new()
    {
        Id = x.Id, ImageUrl = x.ImageUrl, Badge = x.Badge, Eyebrow = x.Eyebrow, Title = x.Title, Highlight = x.Highlight,
        Description = x.Description, PrimaryButtonText = x.PrimaryButtonText, PrimaryButtonUrl = x.PrimaryButtonUrl,
        SecondaryButtonText = x.SecondaryButtonText, SecondaryButtonUrl = x.SecondaryButtonUrl, SortOrder = x.SortOrder, IsActive = x.IsActive
    };
}
