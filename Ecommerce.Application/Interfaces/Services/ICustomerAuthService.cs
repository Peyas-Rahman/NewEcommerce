using Ecommerce.Application.DTOs.Customer;

namespace Ecommerce.Application.Interfaces.Services;

public interface ICustomerAuthService
{
    Task<CustomerAuthResponseDto> RegisterAsync(
        RegisterCustomerDto dto);

    Task<CustomerAuthResponseDto> LoginAsync(
        LoginCustomerDto dto);
}