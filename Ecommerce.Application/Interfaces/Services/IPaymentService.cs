using Ecommerce.Application.DTOs.Payment;

namespace Ecommerce.Application.Interfaces.Services;

public interface IPaymentService
{
    Task<PaymentDto?> GetByIdAsync(
        int id);

    Task<PaymentDto?> GetByOrderIdAsync(
        int orderId);

    Task<PaymentDto> CreateAsync(
        CreatePaymentDto dto);

    Task<PaymentDto?> UpdateStatusAsync(
        int id,
        UpdatePaymentStatusDto dto);
}