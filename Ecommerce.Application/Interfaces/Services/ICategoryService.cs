using Ecommerce.Application.DTOs.Categories;

namespace Ecommerce.Application.Interfaces.Services;

public interface ICategoryService
{
    Task<IEnumerable<CategoryDto>> GetAllAsync();

    Task<CategoryDto?> GetByIdAsync(int id);

    Task<CategoryDto> CreateAsync(CreateCategoryDto dto);

    Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryDto dto);

    Task<bool> DeleteAsync(int id);
}