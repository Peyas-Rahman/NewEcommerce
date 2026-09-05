using Ecommerce.Application.DTOs.ProductVariants;

namespace Ecommerce.Application.Interfaces.Services;

public interface IProductVariantService
{
    Task<IEnumerable<ProductVariantDto>> GetByProductIdAsync(
        int productId);

    Task<ProductVariantDto?> GetByIdAsync(int id);

    Task<ProductVariantDto?> CreateAsync(
        int productId,
        CreateProductVariantDto dto);

    Task<ProductVariantDto?> UpdateAsync(
        int id,
        UpdateProductVariantDto dto);

    Task<bool> DeleteAsync(int id);
}