using Ecommerce.Application.DTOs.FlashSales;

namespace Ecommerce.Application.Interfaces.Services;

public interface IFlashSaleService
{
    Task<IEnumerable<FlashSaleDto>> GetAllAsync(bool activeOnly = false);
    Task<FlashSaleDto?> GetByIdAsync(int id);
    Task<FlashSaleDto> CreateAsync(CreateFlashSaleDto dto);
    Task<FlashSaleDto?> UpdateAsync(int id, CreateFlashSaleDto dto);
    Task<bool> DeleteAsync(int id);
}
