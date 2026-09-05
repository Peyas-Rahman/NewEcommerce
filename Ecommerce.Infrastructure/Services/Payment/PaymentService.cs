using Ecommerce.Application.DTOs.Payment;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

using PaymentEntity = Ecommerce.Domain.Entities.Payment;

namespace Ecommerce.Infrastructure.Services.Payment;

public class PaymentService : IPaymentService
{
    private readonly ApplicationDbContext _context;

    public PaymentService(ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET PAYMENT BY ID
    // =========================================================

    public async Task<PaymentDto?> GetByIdAsync(int id)
    {
        var payment =
            await _context.Payments
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    !x.IsDeleted);

        return payment is null
            ? null
            : MapToDto(payment);
    }

    // =========================================================
    // GET PAYMENT BY ORDER ID
    // =========================================================

    public async Task<PaymentDto?> GetByOrderIdAsync(
        int orderId)
    {
        var payment =
            await _context.Payments
                .AsNoTracking()
                .Where(x =>
                    x.OrderId == orderId &&
                    !x.IsDeleted)
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync();

        return payment is null
            ? null
            : MapToDto(payment);
    }

    // =========================================================
    // CREATE PAYMENT
    // =========================================================

    public async Task<PaymentDto> CreateAsync(
        CreatePaymentDto dto)
    {
        // -----------------------------------------------------
        // Validate Order
        // -----------------------------------------------------

        var order =
            await _context.Orders
                .FirstOrDefaultAsync(x =>
                    x.Id == dto.OrderId &&
                    !x.IsDeleted);

        if (order is null)
        {
            throw new ArgumentException(
                "Order not found.");
        }

        // -----------------------------------------------------
        // Validate Payment Method
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(
            dto.PaymentMethod))
        {
            throw new ArgumentException(
                "Payment method is required.");
        }

        // -----------------------------------------------------
        // Validate Amount
        // -----------------------------------------------------

        if (dto.Amount <= 0)
        {
            throw new ArgumentException(
                "Payment amount must be greater than zero.");
        }

        // -----------------------------------------------------
        // Validate Amount Against Order
        // -----------------------------------------------------

        if (dto.Amount != order.GrandTotal)
        {
            throw new ArgumentException(
                "Payment amount must match order grand total.");
        }

        // -----------------------------------------------------
        // Check Existing Payment
        // -----------------------------------------------------

        var existingPayment =
            await _context.Payments
                .AnyAsync(x =>
                    x.OrderId == dto.OrderId &&
                    !x.IsDeleted &&
                    x.PaymentStatus != "Failed" &&
                    x.PaymentStatus != "Cancelled");

        if (existingPayment)
        {
            throw new ArgumentException(
                "A payment already exists for this order.");
        }

        // -----------------------------------------------------
        // Create Payment
        // -----------------------------------------------------

        var payment =
            new PaymentEntity
            {
                OrderId =
                    dto.OrderId,

                PaymentMethod =
                    dto.PaymentMethod.Trim(),

                PaymentStatus =
                    "Pending",

                Amount =
                    dto.Amount,

                TransactionId =
                    dto.TransactionId?.Trim(),

                PaymentGateway =
                    dto.PaymentGateway?.Trim(),

                Notes =
                    dto.Notes?.Trim(),

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        _context.Payments.Add(payment);

        await _context.SaveChangesAsync();

        return MapToDto(payment);
    }

    // =========================================================
    // UPDATE PAYMENT STATUS
    // =========================================================

    public async Task<PaymentDto?> UpdateStatusAsync(
        int id,
        UpdatePaymentStatusDto dto)
    {
        var payment =
            await _context.Payments
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    !x.IsDeleted);

        if (payment is null)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(
            dto.PaymentStatus))
        {
            throw new ArgumentException(
                "Payment status is required.");
        }

        var status =
            dto.PaymentStatus.Trim();

        var allowedStatuses =
            new[]
            {
                "Pending",
                "Processing",
                "Paid",
                "Failed",
                "Refunded",
                "Cancelled"
            };

        if (!allowedStatuses.Contains(
            status,
            StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                $"Invalid payment status: {status}");
        }

        // -----------------------------------------------------
        // Prevent Invalid Changes
        // -----------------------------------------------------

        if (payment.PaymentStatus == "Refunded")
        {
            throw new ArgumentException(
                "Refunded payment cannot be updated.");
        }

        if (payment.PaymentStatus == "Cancelled")
        {
            throw new ArgumentException(
                "Cancelled payment cannot be updated.");
        }

        // -----------------------------------------------------
        // Paid
        // -----------------------------------------------------

        if (status.Equals(
            "Paid",
            StringComparison.OrdinalIgnoreCase))
        {
            payment.PaidAt =
                DateTime.UtcNow;

            payment.FailureReason =
                null;
        }

        // -----------------------------------------------------
        // Failed
        // -----------------------------------------------------

        if (status.Equals(
            "Failed",
            StringComparison.OrdinalIgnoreCase))
        {
            payment.FailureReason =
                dto.FailureReason?.Trim();

            payment.PaidAt =
                null;
        }

        // -----------------------------------------------------
        // Other Statuses
        // -----------------------------------------------------

        if (!status.Equals(
                "Paid",
                StringComparison.OrdinalIgnoreCase) &&
            !status.Equals(
                "Failed",
                StringComparison.OrdinalIgnoreCase))
        {
            payment.FailureReason =
                dto.FailureReason?.Trim();
        }

        // -----------------------------------------------------
        // Transaction ID
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(
            dto.TransactionId))
        {
            payment.TransactionId =
                dto.TransactionId.Trim();
        }

        // -----------------------------------------------------
        // Notes
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(
            dto.Notes))
        {
            payment.Notes =
                dto.Notes.Trim();
        }

        // -----------------------------------------------------
        // Update Status
        // -----------------------------------------------------

        // -----------------------------------------------------
        // Update Payment Status
        // -----------------------------------------------------

        payment.PaymentStatus =
            status;

        payment.UpdatedAt =
            DateTime.UtcNow;

        // -----------------------------------------------------
        // Sync Order Payment Status
        // -----------------------------------------------------

        var order =
            await _context.Orders
                .FirstOrDefaultAsync(x =>
                    x.Id == payment.OrderId &&
                    !x.IsDeleted);

        if (order is not null)
        {
            order.PaymentStatus =
                status;

            order.UpdatedAt =
                DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return MapToDto(payment);
    }

    // =========================================================
    // MAP PAYMENT TO DTO
    // =========================================================

    private static PaymentDto MapToDto(
        PaymentEntity payment)
    {
        return new PaymentDto
        {
            Id =
                payment.Id,

            OrderId =
                payment.OrderId,

            PaymentMethod =
                payment.PaymentMethod,

            PaymentStatus =
                payment.PaymentStatus,

            Amount =
                payment.Amount,

            TransactionId =
                payment.TransactionId,

            PaymentGateway =
                payment.PaymentGateway,

            PaidAt =
                payment.PaidAt,

            FailureReason =
                payment.FailureReason,

            Notes =
                payment.Notes,

            CreatedAt =
                payment.CreatedAt
        };
    }
}