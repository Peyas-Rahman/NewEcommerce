using Ecommerce.Application.DTOs.Menus;

namespace Ecommerce.Application.Interfaces.Services;

public interface IHeaderMenuSettingService
{
    Task<HeaderMenuSettingDto?> GetAsync();

    Task<HeaderMenuSettingDto> UpdateAsync(
        UpdateHeaderMenuSettingDto dto);
}