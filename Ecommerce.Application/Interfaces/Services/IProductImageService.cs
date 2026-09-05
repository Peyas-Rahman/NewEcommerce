using Ecommerce.Application.DTOs.ProductImages;

namespace Ecommerce.Application.Interfaces.Services;

public interface IProductImageService
{
    Task<IEnumerable<ProductImageDto>> GetByProductIdAsync(
        int productId);

    Task<ProductImageDto?> GetByIdAsync(
        int id);

    Task<ProductImageDto?> CreateAsync(
        int productId,
        CreateProductImageDto dto);

    Task<ProductImageDto?> UpdateAsync(
        int id,
        UpdateProductImageDto dto);

    Task<bool> DeleteAsync(
        int id);
}