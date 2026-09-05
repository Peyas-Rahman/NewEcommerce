using Ecommerce.Application.DTOs.Menu;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.Menu;

public class MenuService : IMenuService
{
    private readonly ApplicationDbContext _context;

    public MenuService(ApplicationDbContext context)
    {
        _context = context;
    }


    // =========================================================
    // GET ALL
    // =========================================================

    public async Task<IEnumerable<MenuItemDto>> GetAllAsync()
    {
        var items = await _context.MenuItems
            .AsNoTracking()
            .Include(x => x.Category)
            .OrderBy(x => x.SortOrder)
            .ToListAsync();

        return BuildTree(items);
    }


    // =========================================================
    // GET HEADER MENU
    // =========================================================

    public async Task<IEnumerable<MenuItemDto>> GetHeaderMenuAsync()
    {
        var items = await _context.MenuItems
            .AsNoTracking()
            .Include(x => x.Category)
            .Where(x =>
                x.IsActive &&
                x.ShowInHeader)
            .OrderBy(x => x.SortOrder)
            .ToListAsync();

        return BuildTree(items);
    }


    // =========================================================
    // GET BY ID
    // =========================================================

    public async Task<MenuItemDto?> GetByIdAsync(int id)
    {
        var item = await _context.MenuItems
            .AsNoTracking()
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (item is null)
        {
            return null;
        }

        return MapToDto(item);
    }


    // =========================================================
    // CREATE
    // =========================================================

    public async Task<MenuItemDto> CreateAsync(
        CreateMenuItemDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            throw new ArgumentException(
                "Menu title is required.");
        }


        // Validate Category

        if (dto.CategoryId.HasValue)
        {
            var categoryExists =
                await _context.Categories
                    .AnyAsync(x =>
                        x.Id == dto.CategoryId.Value);

            if (!categoryExists)
            {
                throw new ArgumentException(
                    "Category not found.");
            }
        }


        // Validate Parent

        if (dto.ParentMenuItemId.HasValue)
        {
            var parentExists =
                await _context.MenuItems
                    .AnyAsync(x =>
                        x.Id ==
                        dto.ParentMenuItemId.Value);

            if (!parentExists)
            {
                throw new ArgumentException(
                    "Parent menu item not found.");
            }
        }


        var entity = new MenuItem
        {
            Title = dto.Title.Trim(),

            Url = dto.Url,

            Icon = dto.Icon,

            BadgeText = dto.BadgeText,

            BadgeType = dto.BadgeType,

            CategoryId = dto.CategoryId,

            ParentMenuItemId =
                dto.ParentMenuItemId,

            SortOrder = dto.SortOrder,

            IsActive = dto.IsActive,

            ShowInHeader =
                dto.ShowInHeader,

            OpenInNewTab =
                dto.OpenInNewTab
        };


        _context.MenuItems.Add(entity);

        await _context.SaveChangesAsync();


        return await GetByIdAsync(entity.Id)
            ?? throw new InvalidOperationException(
                "Menu item could not be loaded after creation.");
    }


    // =========================================================
    // UPDATE
    // =========================================================

    public async Task<MenuItemDto?> UpdateAsync(
        int id,
        UpdateMenuItemDto dto)
    {
        var entity =
            await _context.MenuItems
                .FirstOrDefaultAsync(x => x.Id == id);

        if (entity is null)
        {
            return null;
        }


        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            throw new ArgumentException(
                "Menu title is required.");
        }


        // Prevent menu item from becoming its own parent

        if (dto.ParentMenuItemId == id)
        {
            throw new ArgumentException(
                "A menu item cannot be its own parent.");
        }


        // Validate Category

        if (dto.CategoryId.HasValue)
        {
            var categoryExists =
                await _context.Categories
                    .AnyAsync(x =>
                        x.Id == dto.CategoryId.Value);

            if (!categoryExists)
            {
                throw new ArgumentException(
                    "Category not found.");
            }
        }


        // Validate Parent

        if (dto.ParentMenuItemId.HasValue)
        {
            var parentExists =
                await _context.MenuItems
                    .AnyAsync(x =>
                        x.Id ==
                        dto.ParentMenuItemId.Value);

            if (!parentExists)
            {
                throw new ArgumentException(
                    "Parent menu item not found.");
            }
        }


        entity.Title =
            dto.Title.Trim();

        entity.Url =
            dto.Url;

        entity.Icon =
            dto.Icon;

        entity.BadgeText =
            dto.BadgeText;

        entity.BadgeType =
            dto.BadgeType;

        entity.CategoryId =
            dto.CategoryId;

        entity.ParentMenuItemId =
            dto.ParentMenuItemId;

        entity.SortOrder =
            dto.SortOrder;

        entity.IsActive =
            dto.IsActive;

        entity.ShowInHeader =
            dto.ShowInHeader;

        entity.OpenInNewTab =
            dto.OpenInNewTab;


        await _context.SaveChangesAsync();


        return await GetByIdAsync(id);
    }


    // =========================================================
    // DELETE
    // =========================================================

    public async Task<bool> DeleteAsync(int id)
    {
        var entity =
            await _context.MenuItems
                .FirstOrDefaultAsync(x => x.Id == id);

        if (entity is null)
        {
            return false;
        }


        var hasChildren =
            await _context.MenuItems
                .AnyAsync(x =>
                    x.ParentMenuItemId == id);

        if (hasChildren)
        {
            throw new ArgumentException(
                "Cannot delete a menu item that has child menu items.");
        }


        _context.MenuItems.Remove(entity);

        await _context.SaveChangesAsync();

        return true;
    }


    // =========================================================
    // MAP
    // =========================================================

    private static MenuItemDto MapToDto(
        MenuItem item)
    {
        return new MenuItemDto
        {
            Id = item.Id,

            Title = item.Title,

            Url = item.Url,

            Icon = item.Icon,

            BadgeText = item.BadgeText,

            BadgeType = item.BadgeType,

            CategoryId =
                item.CategoryId,

            CategoryName =
                item.Category?.Name,

            ParentMenuItemId =
                item.ParentMenuItemId,

            SortOrder =
                item.SortOrder,

            IsActive =
                item.IsActive,

            ShowInHeader =
                item.ShowInHeader,

            OpenInNewTab =
                item.OpenInNewTab
        };
    }


    // =========================================================
    // BUILD MENU TREE
    // =========================================================

    private static List<MenuItemDto> BuildTree(
        List<MenuItem> items)
    {
        var lookup =
            items.ToDictionary(
                x => x.Id,
                MapToDto);


        var roots = new List<MenuItemDto>();


        foreach (var item in items)
        {
            var dto = lookup[item.Id];


            if (item.ParentMenuItemId.HasValue &&
                lookup.TryGetValue(
                    item.ParentMenuItemId.Value,
                    out var parent))
            {
                parent.Children.Add(dto);
            }
            else
            {
                roots.Add(dto);
            }
        }


        SortChildren(roots);

        return roots;
    }


    // =========================================================
    // SORT TREE
    // =========================================================

    private static void SortChildren(
        List<MenuItemDto> items)
    {
        items.Sort(
            (a, b) =>
                a.SortOrder.CompareTo(
                    b.SortOrder));


        foreach (var item in items)
        {
            SortChildren(item.Children);
        }
    }
}