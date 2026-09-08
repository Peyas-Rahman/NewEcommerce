using Ecommerce.Application.DTOs.ProductQuestions;

namespace Ecommerce.Application.Interfaces.Services;

public interface IProductQuestionService
{
    Task<IEnumerable<ProductQuestionDto>> GetByProductIdAsync(int productId);
    Task<ProductQuestionDto?> CreateAsync(int productId, int customerId, CreateProductQuestionDto dto);
}
