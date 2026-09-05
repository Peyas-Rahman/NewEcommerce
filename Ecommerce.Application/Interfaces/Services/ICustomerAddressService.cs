using Ecommerce.Application.DTOs.Customer;

namespace Ecommerce.Application.Interfaces.Services;

public interface ICustomerAddressService
{
    Task<IReadOnlyList<CustomerAddressDto>>
        GetMyAddressesAsync(int customerId);

    Task<CustomerAddressDto?>
        GetByIdAsync(
            int customerId,
            int addressId);

    Task<CustomerAddressDto>
        CreateAsync(
            int customerId,
            CreateCustomerAddressDto dto);

    Task<CustomerAddressDto?>
        UpdateAsync(
            int customerId,
            int addressId,
            UpdateCustomerAddressDto dto);

    Task<bool>
        DeleteAsync(
            int customerId,
            int addressId);
}