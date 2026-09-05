using Ecommerce.Application.DTOs.ProductImages;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.ProductImages;

public class ProductImageService : IProductImageService
{
    private readonly ApplicationDbContext _context;

    public ProductImageService(
        ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProductImageDto>>
        GetByProductIdAsync(int productId)
    {
        return await _context.ProductImages
            .AsNoTracking()
            .Where(x =>
                x.ProductId == productId &&
                !x.IsDeleted)
            .OrderByDescending(x => x.IsPrimary)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.Id)
            .Select(x => new ProductImageDto
            {
                Id = x.Id,
                ProductId = x.ProductId,
                ImageUrl = x.ImageUrl,
                AltText = x.AltText,
                IsPrimary = x.IsPrimary,
                SortOrder = x.SortOrder
            })
            .ToListAsync();
    }

    public async Task<ProductImageDto?>
        GetByIdAsync(int id)
    {
        var image =
            await _context.ProductImages
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    !x.IsDeleted);

        if (image == null)
            return null;

        return MapToDto(image);
    }

    public async Task<ProductImageDto?>
        CreateAsync(
            int productId,
            CreateProductImageDto dto)
    {
        var productExists =
            await _context.Products
                .AnyAsync(x =>
                    x.Id == productId &&
                    !x.IsDeleted &&
                    x.IsActive);

        if (!productExists)
            return null;

        if (string.IsNullOrWhiteSpace(
                dto.ImageUrl))
        {
            throw new ArgumentException(
                "Image URL is required.");
        }

        if (dto.IsPrimary)
        {
            var primaryImages =
                await _context.ProductImages
                    .Where(x =>
                        x.ProductId == productId &&
                        x.IsPrimary &&
                        !x.IsDeleted)
                    .ToListAsync();

            foreach (var image in primaryImages)
            {
                image.IsPrimary = false;
                image.UpdatedAt =
                    DateTime.UtcNow;
            }
        }

        var entity = new ProductImage
        {
            ProductId = productId,

            ImageUrl =
                dto.ImageUrl.Trim(),

            AltText =
                dto.AltText?.Trim(),

            IsPrimary =
                dto.IsPrimary,

            SortOrder =
                dto.SortOrder,

            CreatedAt =
                DateTime.UtcNow,

            IsDeleted = false
        };

        _context.ProductImages.Add(entity);

        await _context.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<ProductImageDto?>
        UpdateAsync(
            int id,
            UpdateProductImageDto dto)
    {
        var image =
            await _context.ProductImages
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    !x.IsDeleted);

        if (image == null)
            return null;

        if (string.IsNullOrWhiteSpace(
                dto.ImageUrl))
        {
            throw new ArgumentException(
                "Image URL is required.");
        }

        if (dto.IsPrimary)
        {
            var primaryImages =
                await _context.ProductImages
                    .Where(x =>
                        x.ProductId ==
                            image.ProductId &&
                        x.Id != id &&
                        x.IsPrimary &&
                        !x.IsDeleted)
                    .ToListAsync();

            foreach (var item in primaryImages)
            {
                item.IsPrimary = false;
                item.UpdatedAt =
                    DateTime.UtcNow;
            }
        }

        image.ImageUrl =
            dto.ImageUrl.Trim();

        image.AltText =
            dto.AltText?.Trim();

        image.IsPrimary =
            dto.IsPrimary;

        image.SortOrder =
            dto.SortOrder;

        image.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(image);
    }

    public async Task<bool>
        DeleteAsync(int id)
    {
        var image =
            await _context.ProductImages
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    !x.IsDeleted);

        if (image == null)
            return false;

        image.IsDeleted = true;

        image.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    private static ProductImageDto
        MapToDto(ProductImage image)
    {
        return new ProductImageDto
        {
            Id = image.Id,
            ProductId = image.ProductId,
            ImageUrl = image.ImageUrl,
            AltText = image.AltText,
            IsPrimary = image.IsPrimary,
            SortOrder = image.SortOrder
        };
    }
}