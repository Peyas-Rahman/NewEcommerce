using Ecommerce.Application.DTOs.Brands;

namespace Ecommerce.Application.Interfaces.Services;

public interface IBrandService
{
    Task<IEnumerable<BrandDto>> GetAllAsync();

    Task<BrandDto?> GetByIdAsync(int id);

    Task<BrandDto> CreateAsync(CreateBrandDto dto);

    Task<BrandDto?> UpdateAsync(int id, UpdateBrandDto dto);

    Task<bool> DeleteAsync(int id);
}