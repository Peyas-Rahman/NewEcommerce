using Ecommerce.Application.DTOs.Categories;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.Categories;

public class CategoryService : ICategoryService
{
    private readonly ApplicationDbContext _context;

    public CategoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET ALL
    // =========================================================

    public async Task<IEnumerable<CategoryDto>> GetAllAsync()
    {
        return await _context.Categories
            .AsNoTracking()
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.ParentCategoryId)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => new CategoryDto
            {
                Id = x.Id,
                Name = x.Name,
                Slug = x.Slug,
                Description = x.Description,
                ImageUrl = x.ImageUrl,
                ParentCategoryId = x.ParentCategoryId,
                IsActive = x.IsActive,
                IsFeatured = x.IsFeatured,
                SortOrder = x.SortOrder
            })
            .ToListAsync();
    }

    // =========================================================
    // GET BY ID
    // =========================================================

    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        return await _context.Categories
            .AsNoTracking()
            .Where(x =>
                x.Id == id &&
                !x.IsDeleted)
            .Select(x => new CategoryDto
            {
                Id = x.Id,
                Name = x.Name,
                Slug = x.Slug,
                Description = x.Description,
                ImageUrl = x.ImageUrl,
                ParentCategoryId = x.ParentCategoryId,
                IsActive = x.IsActive,
                IsFeatured = x.IsFeatured,
                SortOrder = x.SortOrder
            })
            .FirstOrDefaultAsync();
    }

    // =========================================================
    // CREATE
    // =========================================================

    public async Task<CategoryDto> CreateAsync(
        CreateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException(
                "Category name is required.");
        }

        var name = dto.Name.Trim();

        var slug = GenerateSlug(name);

        // -----------------------------------------------------
        // Validate Parent Category
        // -----------------------------------------------------

        if (dto.ParentCategoryId.HasValue)
        {
            var parentExists =
                await _context.Categories.AnyAsync(x =>
                    x.Id == dto.ParentCategoryId.Value &&
                    !x.IsDeleted);

            if (!parentExists)
            {
                throw new ArgumentException(
                    "Parent category not found.");
            }
        }

        // -----------------------------------------------------
        // SAME PARENT DUPLICATE CHECK
        //
        // Same category under different parents = ALLOWED
        // Same category under same parent = NOT ALLOWED
        // -----------------------------------------------------

        var duplicateExists =
            await _context.Categories.AnyAsync(x =>
                !x.IsDeleted &&
                x.ParentCategoryId ==
                    dto.ParentCategoryId &&
                x.Slug == slug);

        if (duplicateExists)
        {
            throw new ArgumentException(
                "A category with the same name already exists under this parent category.");
        }

        // -----------------------------------------------------
        // CREATE
        // -----------------------------------------------------

        var category = new Category
        {
            Name = name,

            Slug = slug,

            Description =
                dto.Description?.Trim(),

            ImageUrl =
                dto.ImageUrl?.Trim(),

            ParentCategoryId =
                dto.ParentCategoryId,

            IsActive =
                dto.IsActive,

            IsFeatured =
                dto.IsFeatured,

            SortOrder =
                dto.SortOrder,

            CreatedAt =
                DateTime.UtcNow,

            IsDeleted = false
        };

        _context.Categories.Add(category);

        await _context.SaveChangesAsync();

        return MapToDto(category);
    }

    // =========================================================
    // UPDATE
    // =========================================================

    public async Task<CategoryDto?> UpdateAsync(
        int id,
        UpdateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException(
                "Category name is required.");
        }

        var category =
            await _context.Categories
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    !x.IsDeleted);

        if (category is null)
        {
            return null;
        }

        var name = dto.Name.Trim();

        var slug = GenerateSlug(name);

        // -----------------------------------------------------
        // CANNOT BE ITS OWN PARENT
        // -----------------------------------------------------

        if (
            dto.ParentCategoryId.HasValue &&
            dto.ParentCategoryId.Value == id
        )
        {
            throw new ArgumentException(
                "A category cannot be its own parent.");
        }

        // -----------------------------------------------------
        // VALIDATE PARENT
        // -----------------------------------------------------

        if (dto.ParentCategoryId.HasValue)
        {
            var parentExists =
                await _context.Categories.AnyAsync(x =>
                    x.Id == dto.ParentCategoryId.Value &&
                    !x.IsDeleted);

            if (!parentExists)
            {
                throw new ArgumentException(
                    "Parent category not found.");
            }

            // -------------------------------------------------
            // PREVENT CIRCULAR HIERARCHY
            // -------------------------------------------------

            if (
                await WouldCreateCircularReferenceAsync(
                    id,
                    dto.ParentCategoryId.Value)
            )
            {
                throw new ArgumentException(
                    "Invalid parent category. This would create a circular category hierarchy.");
            }
        }

        // -----------------------------------------------------
        // SAME PARENT DUPLICATE CHECK
        //
        // Ignore current category itself.
        // Different parents can have same slug.
        // -----------------------------------------------------

        var duplicateExists =
            await _context.Categories.AnyAsync(x =>
                x.Id != id &&
                !x.IsDeleted &&
                x.ParentCategoryId ==
                    dto.ParentCategoryId &&
                x.Slug == slug);

        if (duplicateExists)
        {
            throw new ArgumentException(
                "A category with the same name already exists under this parent category.");
        }

        // -----------------------------------------------------
        // UPDATE
        // -----------------------------------------------------

        category.Name = name;

        category.Slug = slug;

        category.Description =
            dto.Description?.Trim();

        category.ImageUrl =
            dto.ImageUrl?.Trim();

        category.ParentCategoryId =
            dto.ParentCategoryId;

        category.IsActive =
            dto.IsActive;

        category.IsFeatured =
            dto.IsFeatured;

        category.SortOrder =
            dto.SortOrder;

        category.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(category);
    }

    // =========================================================
    // DELETE
    // =========================================================

    public async Task<bool> DeleteAsync(int id)
    {
        var category =
            await _context.Categories
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    !x.IsDeleted);

        if (category is null)
        {
            return false;
        }

        // -----------------------------------------------------
        // SOFT DELETE CATEGORY + ALL CHILD CATEGORIES
        // -----------------------------------------------------

        var categoryIds =
            await GetAllDescendantIdsAsync(id);

        categoryIds.Add(id);

        var categories =
            await _context.Categories
                .Where(x =>
                    categoryIds.Contains(x.Id) &&
                    !x.IsDeleted)
                .ToListAsync();

        var now = DateTime.UtcNow;

        foreach (var item in categories)
        {
            item.IsDeleted = true;
            item.UpdatedAt = now;
        }

        await _context.SaveChangesAsync();

        return true;
    }

    // =========================================================
    // GET ALL DESCENDANTS
    // =========================================================

    private async Task<List<int>> GetAllDescendantIdsAsync(
        int parentId)
    {
        var result = new List<int>();

        var directChildren =
            await _context.Categories
                .AsNoTracking()
                .Where(x =>
                    x.ParentCategoryId == parentId &&
                    !x.IsDeleted)
                .Select(x => x.Id)
                .ToListAsync();

        foreach (var childId in directChildren)
        {
            result.Add(childId);

            var descendants =
                await GetAllDescendantIdsAsync(childId);

            result.AddRange(descendants);
        }

        return result;
    }

    // =========================================================
    // CIRCULAR REFERENCE CHECK
    // =========================================================

    private async Task<bool>
        WouldCreateCircularReferenceAsync(
            int categoryId,
            int newParentId)
    {
        var currentParentId = newParentId;

        var visited = new HashSet<int>();

        while (true)
        {
            // We reached the category being updated.
            if (currentParentId == categoryId)
            {
                return true;
            }

            // Safety against unexpected existing cycles.
            if (!visited.Add(currentParentId))
            {
                return true;
            }

            var parentId =
                await _context.Categories
                    .AsNoTracking()
                    .Where(x =>
                        x.Id == currentParentId &&
                        !x.IsDeleted)
                    .Select(x => x.ParentCategoryId)
                    .FirstOrDefaultAsync();

            if (!parentId.HasValue)
            {
                return false;
            }

            currentParentId =
                parentId.Value;
        }
    }

    // =========================================================
    // MAP TO DTO
    // =========================================================

    private static CategoryDto MapToDto(
        Category category)
    {
        return new CategoryDto
        {
            Id = category.Id,

            Name = category.Name,

            Slug = category.Slug,

            Description =
                category.Description,

            ImageUrl =
                category.ImageUrl,

            ParentCategoryId =
                category.ParentCategoryId,

            IsActive =
                category.IsActive,

            SortOrder =
                category.SortOrder
        };
    }

    // =========================================================
    // SLUG GENERATOR
    // =========================================================

    private static string GenerateSlug(
        string name)
    {
        return name
            .Trim()
            .ToLowerInvariant()
            .Replace(" ", "-");
    }
}