using Ecommerce.Application.DTOs.HomepageSliders;

namespace Ecommerce.Application.Interfaces.Services;

public interface IHomepageSliderService
{
    Task<IEnumerable<HomepageSliderDto>> GetAllAsync(bool activeOnly = false);
    Task<HomepageSliderDto?> GetByIdAsync(int id);
    Task<HomepageSliderDto> CreateAsync(CreateHomepageSliderDto dto);
    Task<HomepageSliderDto?> UpdateAsync(int id, CreateHomepageSliderDto dto);
    Task<bool> DeleteAsync(int id);
}
