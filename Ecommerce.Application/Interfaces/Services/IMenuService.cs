using Ecommerce.Application.DTOs.Menu;

namespace Ecommerce.Application.Interfaces.Services;

public interface IMenuService
{
    Task<IEnumerable<MenuItemDto>> GetAllAsync();

    Task<IEnumerable<MenuItemDto>> GetHeaderMenuAsync();

    Task<MenuItemDto?> GetByIdAsync(int id);

    Task<MenuItemDto> CreateAsync(CreateMenuItemDto dto);

    Task<MenuItemDto?> UpdateAsync(
        int id,
        UpdateMenuItemDto dto);

    Task<bool> DeleteAsync(int id);
}