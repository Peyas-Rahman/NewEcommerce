using Ecommerce.Application.DTOs.ProductReviews;

namespace Ecommerce.Application.Interfaces.Services;

public interface IProductReviewService
{
    Task<IEnumerable<ProductReviewDto>> GetByProductIdAsync(int productId);
    Task<ProductReviewDto?> CreateAsync(int productId, int customerId, CreateProductReviewDto dto);
}
