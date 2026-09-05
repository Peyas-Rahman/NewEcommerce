using Ecommerce.Application.DTOs.Order;

namespace Ecommerce.Application.Interfaces.Services;

public interface IOrderService
{
    Task<OrderDto?> CreateAsync(
        CreateOrderDto dto);

    Task<OrderDto?> GetByIdAsync(
        int id);

    Task<OrderDto?> GetByOrderNumberAsync(
        string orderNumber);

    Task<IEnumerable<OrderDto>> GetAllAsync();

    Task<bool> UpdateStatusAsync(
        int orderId,
        string status,
        string? note = null);

    Task<bool> CancelAsync(
        int orderId,
        string? note = null);

    Task<IReadOnlyList<OrderDto>> GetCustomerOrdersAsync(
    int customerId);


    Task<OrderDto?> GetCustomerOrderByIdAsync(
    int customerId,
    int orderId);

}