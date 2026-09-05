using Ecommerce.Application.DTOs.ProductVariants;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.ProductVariants;

public class ProductVariantService : IProductVariantService
{
    private readonly ApplicationDbContext _context;

    public ProductVariantService(ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET VARIANTS BY PRODUCT
    // =========================================================

    public async Task<IEnumerable<ProductVariantDto>> GetByProductIdAsync(
        int productId)
    {
        return await _context.ProductVariants
            .AsNoTracking()
            .Where(x =>
                x.ProductId == productId &&
                !x.IsDeleted &&
                x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .ThenBy(x => x.Id)
            .Select(x => MapToDto(x))
            .ToListAsync();
    }

    // =========================================================
    // GET VARIANT BY ID
    // =========================================================

    public async Task<ProductVariantDto?> GetByIdAsync(
        int id)
    {
        var variant =
            await _context.ProductVariants
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    !x.IsDeleted);

        return variant is null
            ? null
            : MapToDto(variant);
    }

    // =========================================================
    // CREATE VARIANT
    // =========================================================

    public async Task<ProductVariantDto?> CreateAsync(
        int productId,
        CreateProductVariantDto dto)
    {
        // -----------------------------------------------------
        // Validate Product
        // -----------------------------------------------------

        var productExists =
            await _context.Products
                .AsNoTracking()
                .AnyAsync(x =>
                    x.Id == productId &&
                    !x.IsDeleted &&
                    x.IsActive);

        if (!productExists)
        {
            return null;
        }

        // -----------------------------------------------------
        // Validate Name
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException(
                "Variant name is required.");
        }

        // -----------------------------------------------------
        // Validate Price
        // -----------------------------------------------------

        if (dto.Price.HasValue &&
            dto.Price.Value < 0)
        {
            throw new ArgumentException(
                "Variant price cannot be negative.");
        }

        if (dto.DiscountPrice.HasValue &&
            dto.DiscountPrice.Value < 0)
        {
            throw new ArgumentException(
                "Variant discount price cannot be negative.");
        }

        if (dto.Price.HasValue &&
            dto.DiscountPrice.HasValue &&
            dto.DiscountPrice.Value >= dto.Price.Value)
        {
            throw new ArgumentException(
                "Variant discount price must be lower than regular price.");
        }

        // -----------------------------------------------------
        // SKU
        // -----------------------------------------------------

        string sku;

        if (!string.IsNullOrWhiteSpace(dto.SKU))
        {
            sku = dto.SKU.Trim();

            var skuExists =
                await _context.ProductVariants
                    .AnyAsync(x =>
                        x.SKU == sku &&
                        !x.IsDeleted);

            if (skuExists)
            {
                throw new ArgumentException(
                    "Variant SKU already exists.");
            }
        }
        else
        {
            sku =
                await GenerateUniqueSkuAsync(
                    productId,
                    dto.Name);
        }

        // -----------------------------------------------------
        // Create Variant
        // -----------------------------------------------------

        var variant =
            new ProductVariant
            {
                ProductId =
                    productId,

                Name =
                    dto.Name.Trim(),

                SKU =
                    sku,

                Price =
                    dto.Price,

                DiscountPrice =
                    dto.DiscountPrice,

                TrackInventory =
                    dto.TrackInventory,

                IsActive =
                    dto.IsActive,

                SortOrder =
                    dto.SortOrder,

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        _context.ProductVariants.Add(
            variant);

        await _context.SaveChangesAsync();

        return MapToDto(variant);
    }

    // =========================================================
    // UPDATE VARIANT
    // =========================================================

    public async Task<ProductVariantDto?> UpdateAsync(
        int id,
        UpdateProductVariantDto dto)
    {
        var variant =
            await _context.ProductVariants
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    !x.IsDeleted);

        if (variant is null)
        {
            return null;
        }

        // -----------------------------------------------------
        // Validate Name
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException(
                "Variant name is required.");
        }

        // -----------------------------------------------------
        // Validate Price
        // -----------------------------------------------------

        if (dto.Price.HasValue &&
            dto.Price.Value < 0)
        {
            throw new ArgumentException(
                "Variant price cannot be negative.");
        }

        if (dto.DiscountPrice.HasValue &&
            dto.DiscountPrice.Value < 0)
        {
            throw new ArgumentException(
                "Variant discount price cannot be negative.");
        }

        if (dto.Price.HasValue &&
            dto.DiscountPrice.HasValue &&
            dto.DiscountPrice.Value >= dto.Price.Value)
        {
            throw new ArgumentException(
                "Variant discount price must be lower than regular price.");
        }

        // -----------------------------------------------------
        // SKU
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(dto.SKU))
        {
            var newSku =
                dto.SKU.Trim();

            if (!string.Equals(
                newSku,
                variant.SKU,
                StringComparison.OrdinalIgnoreCase))
            {
                var skuExists =
                    await _context.ProductVariants
                        .AnyAsync(x =>
                            x.Id != id &&
                            x.SKU == newSku &&
                            !x.IsDeleted);

                if (skuExists)
                {
                    throw new ArgumentException(
                        "Variant SKU already exists.");
                }

                variant.SKU =
                    newSku;
            }
        }

        // -----------------------------------------------------
        // Update
        // -----------------------------------------------------

        variant.Name =
            dto.Name.Trim();

        variant.Price =
            dto.Price;

        variant.DiscountPrice =
            dto.DiscountPrice;

        variant.TrackInventory =
            dto.TrackInventory;

        variant.IsActive =
            dto.IsActive;

        variant.SortOrder =
            dto.SortOrder;

        variant.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(variant);
    }

    // =========================================================
    // DELETE VARIANT
    // =========================================================

    public async Task<bool> DeleteAsync(
        int id)
    {
        var variant =
            await _context.ProductVariants
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    !x.IsDeleted);

        if (variant is null)
        {
            return false;
        }

        variant.IsDeleted =
            true;

        variant.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    // =========================================================
    // MAP ENTITY TO DTO
    // =========================================================

    private static ProductVariantDto MapToDto(
        ProductVariant variant)
    {
        return new ProductVariantDto
        {
            Id =
                variant.Id,

            ProductId =
                variant.ProductId,

            Name =
                variant.Name,

            SKU =
                variant.SKU,

            Price =
                variant.Price,

            DiscountPrice =
                variant.DiscountPrice,

            TrackInventory =
                variant.TrackInventory,

            IsActive =
                variant.IsActive,

            SortOrder =
                variant.SortOrder
        };
    }

    // =========================================================
    // GENERATE UNIQUE SKU
    // =========================================================

    private async Task<string>
        GenerateUniqueSkuAsync(
            int productId,
            string variantName)
    {
        var prefix =
            new string(
                variantName
                    .Where(char.IsLetterOrDigit)
                    .Take(3)
                    .ToArray())
            .ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(
            prefix))
        {
            prefix = "VAR";
        }

        var number = 1;

        while (true)
        {
            var sku =
                $"{prefix}-{productId:D4}-{number:D3}";

            var exists =
                await _context.ProductVariants
                    .AnyAsync(x =>
                        x.SKU == sku &&
                        !x.IsDeleted);

            if (!exists)
            {
                return sku;
            }

            number++;
        }
    }
}