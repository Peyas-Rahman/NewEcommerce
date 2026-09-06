using Ecommerce.Application.DTOs.Products;

namespace Ecommerce.Application.Interfaces.Services;

public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetAllAsync();

    Task<ProductDto?> GetByIdAsync(int id);

    Task<ProductDto> CreateAsync(CreateProductDto dto);

    Task<ProductDto?> UpdateAsync(int id, UpdateProductDto dto);

    Task<bool> DeleteAsync(int id);
    Task<ProductPagedResultDto> SearchAsync(
    ProductQueryDto query);

    Task<ProductDetailsDto?> GetDetailsAsync(int id);

    Task<ProductDetailsDto?> GetDetailsBySlugAsync(string slug);

}