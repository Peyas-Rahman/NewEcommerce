using Ecommerce.Application.DTOs.ProductImages;
using Ecommerce.Application.DTOs.Products;
using Ecommerce.Application.DTOs.ProductVariants;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.Products;

public class ProductService : IProductService
{
    private readonly ApplicationDbContext _context;

    public ProductService(ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET ALL PRODUCTS
    // =========================================================

    public async Task<IEnumerable<ProductDto>> GetAllAsync()
    {
        return await _context.Products
            .AsNoTracking()
            .Where(x =>
                !x.IsDeleted &&
                x.IsActive)
            .Include(x => x.Category)
            .Include(x => x.Brand)
            .Include(x => x.Images)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => MapToDto(x))
            .ToListAsync();
    }

    // =========================================================
    // GET PRODUCT BY ID
    // =========================================================

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var product = await _context.Products
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Brand)
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                !x.IsDeleted);

        return product is null
            ? null
            : MapToDto(product);
    }

    // =========================================================
    // GET PRODUCT DETAILS
    // =========================================================

    public async Task<ProductDetailsDto?> GetDetailsAsync(int id)
    {
        // -----------------------------------------------------
        // Load product with category, brand, images and variants
        // -----------------------------------------------------

        var product = await _context.Products
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Brand)
            .Include(x => x.Images)
            .Include(x => x.Variants)
            .FirstOrDefaultAsync(x =>
                x.Id == id &&
                !x.IsDeleted &&
                x.IsActive);

        if (product is null)
        {
            return null;
        }

        // -----------------------------------------------------
        // Get variant IDs
        // -----------------------------------------------------

        var variantIds = product.Variants
            .Where(x => x.IsActive)
            .Select(x => x.Id)
            .ToList();

        // -----------------------------------------------------
        // Calculate total available stock
        //
        // Available = StockQuantity - ReservedQuantity
        // -----------------------------------------------------

        var stock = 0;

        if (variantIds.Count > 0)
        {
            stock = await _context.Inventories
                .AsNoTracking()
                .Where(x =>
                    x.ProductVariantId.HasValue &&
                    variantIds.Contains(
                        x.ProductVariantId.Value) &&
                    x.IsActive &&
                    !x.IsDeleted)
                .Select(x =>
                    x.StockQuantity -
                    x.ReservedQuantity)
                .SumAsync();
        }
        else
        {
            // -----------------------------------------------------
            // Simple Product Inventory
            // Product has no variants
            // -----------------------------------------------------

            stock = await _context.Inventories
                .AsNoTracking()
                .Where(x =>
                    x.ProductId == product.Id &&
                    x.ProductVariantId == null &&
                    x.IsActive &&
                    !x.IsDeleted)
                .Select(x =>
                    x.StockQuantity -
                    x.ReservedQuantity)
                .FirstOrDefaultAsync();
        }

        if (stock < 0)
        {
            stock = 0;
        }

        if (stock < 0)
        {
            stock = 0;
        }

        // -----------------------------------------------------
        // Product images
        // -----------------------------------------------------

        var images = product.Images
            .OrderByDescending(x => x.IsPrimary)
            .ThenBy(x => x.SortOrder)
            .Select(x => new ProductImageDto
            {
                Id =
                    x.Id,

                ProductId =
                    x.ProductId,

                ImageUrl =
                    x.ImageUrl,

                AltText =
                    x.AltText,

                IsPrimary =
                    x.IsPrimary,

                SortOrder =
                    x.SortOrder
            })
            .ToList();

        // -----------------------------------------------------
        // Product variants
        // -----------------------------------------------------

        var variants = product.Variants
            .Where(x => x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => new ProductVariantDto
            {
                Id =
                    x.Id,

                ProductId =
                    x.ProductId,

                Name =
                    x.Name,

                SKU =
                    x.SKU,

                Price =
                    x.Price,

                DiscountPrice =
                    x.DiscountPrice,

                TrackInventory =
                    x.TrackInventory,

                IsActive =
                    x.IsActive,

                SortOrder =
                    x.SortOrder
            })
            .ToList();

        // -----------------------------------------------------
        // Return details
        // -----------------------------------------------------

        return new ProductDetailsDto
        {
            Id =
                product.Id,

            Name =
                product.Name,

            Slug =
                product.Slug,

            SKU =
                product.SKU,

            ShortDescription =
                product.ShortDescription,

            Description =
                product.Description,

            Price =
                product.Price,

            DiscountPrice =
                product.DiscountPrice,

            Warranty =
                product.Warranty,

            CategoryId =
                product.CategoryId,

            CategoryName =
                product.Category?.Name ??
                string.Empty,

            BrandId =
                product.BrandId,

            BrandName =
                product.Brand?.Name,

            IsFeatured =
                product.IsFeatured,

            IsBestSeller =
                product.IsBestSeller,

            IsNewArrival =
                product.IsNewArrival,

            IsActive =
                product.IsActive,

            Stock =
                stock,

            IsInStock =
                stock > 0,

            Images =
                images,

            Variants =
                variants
        };
    }

    // =========================================================
    // SEARCH / FILTER / SORT / PAGINATION
    // =========================================================

    public async Task<ProductPagedResultDto> SearchAsync(
        ProductQueryDto query)
    {
        var page =
            query.Page < 1
                ? 1
                : query.Page;

        var pageSize =
            query.PageSize < 1
                ? 20
                : query.PageSize;

        if (pageSize > 100)
        {
            pageSize = 100;
        }

        var products =
            _context.Products
                .AsNoTracking()
                .Where(x =>
                    !x.IsDeleted &&
                    x.IsActive)
                .AsQueryable();

        // -----------------------------------------------------
        // SEARCH
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(
            query.Search))
        {
            var search =
                query.Search.Trim();

            products =
                products.Where(x =>
                    x.Name.Contains(search) ||
                    x.SKU.Contains(search) ||
                    (x.ShortDescription != null &&
                     x.ShortDescription.Contains(search)) ||
                    (x.Description != null &&
                     x.Description.Contains(search)));
        }

        // -----------------------------------------------------
        // CATEGORY
        // -----------------------------------------------------

        if (query.CategoryId.HasValue)
        {
            products =
                products.Where(x =>
                    x.CategoryId ==
                    query.CategoryId.Value);
        }

        // -----------------------------------------------------
        // BRAND
        // -----------------------------------------------------

        if (query.BrandId.HasValue)
        {
            products =
                products.Where(x =>
                    x.BrandId ==
                    query.BrandId.Value);
        }

        // -----------------------------------------------------
        // MIN PRICE
        // -----------------------------------------------------

        if (query.MinPrice.HasValue)
        {
            products =
                products.Where(x =>
                    (x.DiscountPrice ?? x.Price) >=
                    query.MinPrice.Value);
        }

        // -----------------------------------------------------
        // MAX PRICE
        // -----------------------------------------------------

        if (query.MaxPrice.HasValue)
        {
            products =
                products.Where(x =>
                    (x.DiscountPrice ?? x.Price) <=
                    query.MaxPrice.Value);
        }

        // -----------------------------------------------------
        // FEATURED
        // -----------------------------------------------------

        if (query.IsFeatured.HasValue)
        {
            products =
                products.Where(x =>
                    x.IsFeatured ==
                    query.IsFeatured.Value);
        }

        // -----------------------------------------------------
        // BEST SELLER
        // -----------------------------------------------------

        if (query.IsBestSeller.HasValue)
        {
            products =
                products.Where(x =>
                    x.IsBestSeller ==
                    query.IsBestSeller.Value);
        }

        // -----------------------------------------------------
        // NEW ARRIVAL
        // -----------------------------------------------------

        if (query.IsNewArrival.HasValue)
        {
            products =
                products.Where(x =>
                    x.IsNewArrival ==
                    query.IsNewArrival.Value);
        }

        // -----------------------------------------------------
        // TOTAL
        // -----------------------------------------------------

        var totalItems =
            await products.CountAsync();

        // -----------------------------------------------------
        // SORTING
        // -----------------------------------------------------

        products =
            query.SortBy
                .Trim()
                .ToLowerInvariant() switch
            {
                "oldest" =>
                    products.OrderBy(x =>
                        x.CreatedAt),

                "price_asc" =>
                    products.OrderBy(x =>
                        x.DiscountPrice ??
                        x.Price),

                "price_desc" =>
                    products.OrderByDescending(x =>
                        x.DiscountPrice ??
                        x.Price),

                "name_asc" =>
                    products.OrderBy(x =>
                        x.Name),

                "name_desc" =>
                    products.OrderByDescending(x =>
                        x.Name),

                "featured" =>
                    products
                        .OrderByDescending(x =>
                            x.IsFeatured)
                        .ThenBy(x =>
                            x.SortOrder),

                "best_seller" =>
                    products
                        .OrderByDescending(x =>
                            x.IsBestSeller)
                        .ThenBy(x =>
                            x.SortOrder),

                _ =>
                    products
                        .OrderByDescending(x =>
                            x.CreatedAt)
                        .ThenBy(x =>
                            x.SortOrder)
            };

        // -----------------------------------------------------
        // PAGINATION
        // -----------------------------------------------------

        var items =
            await products
                .Include(x => x.Category)
                .Include(x => x.Brand)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => MapToDto(x))
                .ToListAsync();

        // -----------------------------------------------------
        // TOTAL PAGES
        // -----------------------------------------------------

        var totalPages =
            totalItems == 0
                ? 0
                : (int)Math.Ceiling(
                    totalItems /
                    (double)pageSize);

        return new ProductPagedResultDto
        {
            Items =
                items,

            Page =
                page,

            PageSize =
                pageSize,

            TotalItems =
                totalItems,

            TotalPages =
                totalPages
        };
    }

    // =========================================================
    // CREATE PRODUCT
    // =========================================================

    public async Task<ProductDto> CreateAsync(
        CreateProductDto dto)
    {
        var categoryExists =
            await _context.Categories
                .AnyAsync(x =>
                    x.Id == dto.CategoryId &&
                    !x.IsDeleted &&
                    x.IsActive);

        if (!categoryExists)
        {
            throw new ArgumentException(
                "Invalid or inactive category.");
        }

        if (dto.BrandId.HasValue)
        {
            var brandExists =
                await _context.Brands
                    .AnyAsync(x =>
                        x.Id == dto.BrandId.Value &&
                        !x.IsDeleted &&
                        x.IsActive);

            if (!brandExists)
            {
                throw new ArgumentException(
                    "Invalid or inactive brand.");
            }
        }

        if (dto.Price < 0)
        {
            throw new ArgumentException(
                "Price cannot be negative.");
        }

        if (dto.DiscountPrice.HasValue &&
            dto.DiscountPrice.Value < 0)
        {
            throw new ArgumentException(
                "Discount price cannot be negative.");
        }

        if (dto.DiscountPrice.HasValue &&
            dto.DiscountPrice.Value >= dto.Price)
        {
            throw new ArgumentException(
                "Discount price must be lower than regular price.");
        }

        var sku =
            await GenerateUniqueSkuAsync(
                dto.Name);

        var product =
            new Product
            {
                Name =
                    dto.Name.Trim(),

                Slug =
                    GenerateSlug(dto.Name),

                SKU =
                    sku,

                ShortDescription =
                    dto.ShortDescription?.Trim(),

                Description =
                    dto.Description?.Trim(),

                Price =
                    dto.Price,

                DiscountPrice =
                    dto.DiscountPrice,

                Warranty =
                    dto.Warranty?.Trim(),

                IsFeatured =
                    dto.IsFeatured,

                IsBestSeller =
                    dto.IsBestSeller,

                IsNewArrival =
                    dto.IsNewArrival,

                IsActive =
                    dto.IsActive,

                SortOrder =
                    dto.SortOrder,

                CategoryId =
                    dto.CategoryId,

                BrandId =
                    dto.BrandId,

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        _context.Products.Add(product);

        await _context.SaveChangesAsync();

        await _context.Entry(product)
            .Reference(x => x.Category)
            .LoadAsync();

        if (product.BrandId.HasValue)
        {
            await _context.Entry(product)
                .Reference(x => x.Brand)
                .LoadAsync();
        }

        return MapToDto(product);
    }

    // =========================================================
    // UPDATE PRODUCT
    // =========================================================

    public async Task<ProductDto?> UpdateAsync(
        int id,
        UpdateProductDto dto)
    {
        var product =
            await _context.Products
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    !x.IsDeleted);

        if (product is null)
        {
            return null;
        }

        var categoryExists =
            await _context.Categories
                .AnyAsync(x =>
                    x.Id == dto.CategoryId &&
                    !x.IsDeleted &&
                    x.IsActive);

        if (!categoryExists)
        {
            throw new ArgumentException(
                "Invalid or inactive category.");
        }

        if (dto.BrandId.HasValue)
        {
            var brandExists =
                await _context.Brands
                    .AnyAsync(x =>
                        x.Id == dto.BrandId.Value &&
                        !x.IsDeleted &&
                        x.IsActive);

            if (!brandExists)
            {
                throw new ArgumentException(
                    "Invalid or inactive brand.");
            }
        }

        if (dto.Price < 0)
        {
            throw new ArgumentException(
                "Price cannot be negative.");
        }

        if (dto.DiscountPrice.HasValue &&
            dto.DiscountPrice.Value < 0)
        {
            throw new ArgumentException(
                "Discount price cannot be negative.");
        }

        if (dto.DiscountPrice.HasValue &&
            dto.DiscountPrice.Value >= dto.Price)
        {
            throw new ArgumentException(
                "Discount price must be lower than regular price.");
        }

        product.Name =
            dto.Name.Trim();

        product.Slug =
            GenerateSlug(dto.Name);

        product.ShortDescription =
            dto.ShortDescription?.Trim();

        product.Description =
            dto.Description?.Trim();

        product.Price =
            dto.Price;

        product.DiscountPrice =
            dto.DiscountPrice;

        product.Warranty =
            dto.Warranty?.Trim();

        product.IsFeatured =
            dto.IsFeatured;

        product.IsBestSeller =
            dto.IsBestSeller;

        product.IsNewArrival =
            dto.IsNewArrival;

        product.IsActive =
            dto.IsActive;

        product.SortOrder =
            dto.SortOrder;

        product.CategoryId =
            dto.CategoryId;

        product.BrandId =
            dto.BrandId;

        product.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _context.Entry(product)
            .Reference(x => x.Category)
            .LoadAsync();

        if (product.BrandId.HasValue)
        {
            await _context.Entry(product)
                .Reference(x => x.Brand)
                .LoadAsync();
        }

        return MapToDto(product);
    }

    // =========================================================
    // DELETE PRODUCT
    // =========================================================

    public async Task<bool> DeleteAsync(
        int id)
    {
        var product =
            await _context.Products
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    !x.IsDeleted);

        if (product is null)
        {
            return false;
        }

        product.IsDeleted =
            true;

        product.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    // =========================================================
    // MAP PRODUCT TO DTO
    // =========================================================

    private static ProductDto MapToDto(
        Product product)
    {
        return new ProductDto
        {
            Id =
                product.Id,

            Name =
                product.Name,

            Slug =
                product.Slug,

            SKU =
                product.SKU,

            ShortDescription =
                product.ShortDescription,

            Description =
                product.Description,

            Price =
                product.Price,

            DiscountPrice =
                product.DiscountPrice,

            Warranty =
                product.Warranty,

            IsFeatured =
                product.IsFeatured,

            IsBestSeller =
                product.IsBestSeller,

            IsNewArrival =
                product.IsNewArrival,

            IsActive =
                product.IsActive,

            SortOrder =
                product.SortOrder,

            CategoryId =
                product.CategoryId,

            CategoryName =
                product.Category?.Name ??
                string.Empty,

            BrandId =
                product.BrandId,

            BrandName =
                product.Brand?.Name
                ,

            Images = product.Images
                .OrderByDescending(x => x.IsPrimary)
                .ThenBy(x => x.SortOrder)
                .Select(x => new ProductImageDto
                {
                    Id = x.Id,
                    ProductId = x.ProductId,
                    ImageUrl = x.ImageUrl,
                    AltText = x.AltText,
                    IsPrimary = x.IsPrimary,
                    SortOrder = x.SortOrder
                })
                .ToList()
        };
    }

    // =========================================================
    // GENERATE SLUG
    // =========================================================

    private static string GenerateSlug(
        string name)
    {
        return name
            .Trim()
            .ToLowerInvariant()
            .Replace(" ", "-");
    }

    // =========================================================
    // GENERATE UNIQUE SKU
    // =========================================================

    private async Task<string>
        GenerateUniqueSkuAsync(
            string productName)
    {
        var prefix =
            new string(
                productName
                    .Where(char.IsLetterOrDigit)
                    .Take(3)
                    .ToArray())
            .ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(prefix))
        {
            prefix = "PRD";
        }

        var number = 1;

        string sku;

        do
        {
            sku =
                $"{prefix}-{number:D4}";

            var exists =
                await _context.Products
                    .AnyAsync(x =>
                        x.SKU == sku);

            if (!exists)
            {
                return sku;
            }

            number++;

        } while (true);
    }
}