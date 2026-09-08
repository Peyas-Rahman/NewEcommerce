using Ecommerce.Application.DTOs.Order;
using Ecommerce.Application.DTOs.Inventory;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Ecommerce.Infrastructure.Services.Coupons;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.Order;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly IInventoryService _inventoryService;

    public OrderService(
        ApplicationDbContext context,
        IInventoryService inventoryService)
    {
        _context = context;
        _inventoryService = inventoryService;
    }

    // =========================================================
    // CREATE ORDER
    // =========================================================

    public async Task<OrderDto?> CreateAsync(
        CreateOrderDto dto)
    {
        ValidateOrderRequest(dto);

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            // -------------------------------------------------
            // Validate Customer
            // -------------------------------------------------

            Customer? customer = null;

            if (dto.CustomerId.HasValue)
            {
                customer = await _context.Customers
                    .FirstOrDefaultAsync(x =>
                        x.Id == dto.CustomerId.Value &&
                        x.IsActive &&
                        !x.IsDeleted);

                if (customer is null)
                {
                    throw new ArgumentException(
                        "Customer not found.");
                }
            }

            // -------------------------------------------------
            // Generate Order Number BEFORE Inventory Reserve
            // -------------------------------------------------

            var orderNumber =
                await GenerateOrderNumberAsync();

            // -------------------------------------------------
            // Prepare Order Items
            // -------------------------------------------------

            var orderItems =
                new List<OrderItem>();

            decimal subTotal = 0;

            foreach (var itemDto in dto.Items)
            {
                if (itemDto.Quantity <= 0)
                {
                    throw new ArgumentException(
                        "Product quantity must be greater than zero.");
                }

                // -------------------------------------------------
                // Product
                // -------------------------------------------------

                var product =
                    await _context.Products
                        .FirstOrDefaultAsync(x =>
                            x.Id == itemDto.ProductId &&
                            x.IsActive &&
                            !x.IsDeleted);

                if (product is null)
                {
                    throw new ArgumentException(
                        $"Product {itemDto.ProductId} not found.");
                }

                // -------------------------------------------------
                // Variant
                // -------------------------------------------------

                ProductVariant? variant = null;

                if (itemDto.ProductVariantId.HasValue)
                {
                    variant =
                        await _context.ProductVariants
                            .FirstOrDefaultAsync(x =>
                                x.Id ==
                                itemDto.ProductVariantId.Value &&
                                x.ProductId == product.Id &&
                                x.IsActive &&
                                !x.IsDeleted);

                    if (variant is null)
                    {
                        throw new ArgumentException(
                            "Product variant not found.");
                    }
                }

                // -------------------------------------------------
                // Calculate Current Price
                // -------------------------------------------------

                decimal unitPrice;

                if (variant is not null &&
                    variant.Price.HasValue)
                {
                    unitPrice =
                        variant.DiscountPrice.HasValue &&
                        variant.DiscountPrice.Value <
                        variant.Price.Value
                            ? variant.DiscountPrice.Value
                            : variant.Price.Value;
                }
                else
                {
                    unitPrice =
                        product.DiscountPrice.HasValue &&
                        product.DiscountPrice.Value <
                        product.Price
                            ? product.DiscountPrice.Value
                            : product.Price;
                }

                var totalPrice =
                    unitPrice * itemDto.Quantity;

                // -------------------------------------------------
                // Reserve Inventory
                // -------------------------------------------------

                if (variant is not null &&
                    variant.TrackInventory)
                {
                    var reserveDto =
                        new ReserveStockDto
                        {
                            Quantity =
                                itemDto.Quantity,

                            ReferenceType =
                                "Order",

                            ReferenceId =
                                orderNumber,

                            Note =
                                "Stock reserved for order."
                        };

                    var inventory =
                        await _inventoryService
                            .ReserveStockInTransactionAsync(
                                variant.Id,
                                reserveDto);

                    if (inventory is null)
                    {
                        throw new ArgumentException(
                            $"Inventory not found for variant {variant.Id}.");
                    }
                }

                // -------------------------------------------------
                // Create Order Item
                // -------------------------------------------------

                var orderItem =
                    new OrderItem
                    {
                        ProductId =
                            product.Id,

                        ProductVariantId =
                            variant?.Id,

                        ProductName =
                            product.Name,

                        VariantName =
                            variant?.Name,

                        SKU =
                            variant?.SKU ??
                            product.SKU,

                        UnitPrice =
                            unitPrice,

                        DiscountAmount = 0,

                        Quantity =
                            itemDto.Quantity,

                        TotalPrice =
                            totalPrice,

                        CreatedAt =
                            DateTime.UtcNow,

                        IsDeleted = false
                    };

                orderItems.Add(orderItem);

                subTotal += totalPrice;
            }

            // -------------------------------------------------
            // Create Order
            // -------------------------------------------------

            decimal discountAmount = 0;
            Coupon? coupon = null;

            if (!string.IsNullOrWhiteSpace(dto.CouponCode))
            {
                coupon = await _context.Coupons.FirstOrDefaultAsync(x =>
                    x.Code == dto.CouponCode.Trim().ToUpperInvariant() &&
                    x.IsActive &&
                    !x.IsDeleted);
                if (coupon is null)
                {
                    throw new ArgumentException("Invalid or inactive coupon code.");
                }
                discountAmount = CouponService.Calculate(coupon, subTotal);
                coupon.UsedCount++;
                coupon.UpdatedAt = DateTime.UtcNow;
            }

            var order =
                new Domain.Entities.Order
                {
                    OrderNumber =
                        orderNumber,

                    CustomerId =
                        dto.CustomerId,

                    GuestName =
                        dto.GuestName?.Trim(),

                    GuestPhone =
                        dto.GuestPhone?.Trim(),

                    GuestEmail =
                        dto.GuestEmail?.Trim(),

                    SubTotal =
                        subTotal,

                    DiscountAmount = discountAmount,

                    ShippingAmount = 0,

                    TaxAmount = 0,

                    GrandTotal =
                        subTotal - discountAmount,

                    OrderStatus =
                        "Pending",

                    PaymentStatus =
                        "Pending",

                    PaymentMethod =
                        dto.PaymentMethod.Trim(),

                    ShippingName =
                        dto.ShippingName.Trim(),

                    ShippingPhone =
                        dto.ShippingPhone.Trim(),

                    ShippingAddress =
                        dto.ShippingAddress.Trim(),

                    ShippingCity =
                        dto.ShippingCity?.Trim(),

                    ShippingArea =
                        dto.ShippingArea?.Trim(),

                    ShippingPostalCode =
                        dto.ShippingPostalCode?.Trim(),

                    CustomerNote =
                        dto.CustomerNote?.Trim(),

                    CreatedAt =
                        DateTime.UtcNow,

                    IsDeleted = false
                };

            _context.Orders.Add(order);

            await _context.SaveChangesAsync();

            // -------------------------------------------------
            // Save Order Items
            // -------------------------------------------------

            foreach (var item in orderItems)
            {
                item.OrderId =
                    order.Id;

                _context.OrderItems.Add(item);
            }

            // -------------------------------------------------
            // Order Status History
            // -------------------------------------------------

            var statusHistory =
                new OrderStatusHistory
                {
                    OrderId =
                        order.Id,

                    Status =
                        "Pending",

                    Note =
                        "Order created.",

                    CreatedAt =
                        DateTime.UtcNow,

                    IsDeleted = false
                };

            _context.OrderStatusHistories.Add(
                statusHistory);

            await _context.SaveChangesAsync();

            // -------------------------------------------------
            // Commit Transaction
            // -------------------------------------------------

            await transaction.CommitAsync();

            return await GetByIdAsync(
                order.Id);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // =========================================================
    // GET ORDER BY ID
    // =========================================================

    public async Task<OrderDto?> GetByIdAsync(
        int id)
    {
        var order =
            await _context.Orders
                .AsNoTracking()
                .Include(x => x.OrderItems)
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    !x.IsDeleted);

        if (order is null)
        {
            return null;
        }

        return MapToDto(order);
    }

    // =========================================================
    // GET ORDER BY ORDER NUMBER
    // =========================================================

    public async Task<OrderDto?> GetByOrderNumberAsync(
        string orderNumber)
    {
        var order =
            await _context.Orders
                .AsNoTracking()
                .Include(x => x.OrderItems)
                .FirstOrDefaultAsync(x =>
                    x.OrderNumber == orderNumber &&
                    !x.IsDeleted);

        if (order is null)
        {
            return null;
        }

        return MapToDto(order);
    }

    // =========================================================
    // GET ALL ORDERS
    // =========================================================

    public async Task<IEnumerable<OrderDto>> GetAllAsync()
    {
        var orders =
            await _context.Orders
                .AsNoTracking()
                .Include(x => x.OrderItems)
                .Where(x => !x.IsDeleted)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

        return orders.Select(MapToDto);
    }

    // =========================================================
    // UPDATE ORDER STATUS
    // =========================================================

    public async Task<bool> UpdateStatusAsync(
    int orderId,
    string status,
    string? note = null)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            throw new ArgumentException(
                "Order status is required.");
        }

        status = status.Trim();

        var allowedStatuses = new[]
        {
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled"
    };

        if (!allowedStatuses.Contains(
            status,
            StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                $"Invalid order status: {status}");
        }

        var order =
            await _context.Orders
                .FirstOrDefaultAsync(x =>
                    x.Id == orderId &&
                    !x.IsDeleted);

        if (order is null)
        {
            return false;
        }

        var currentStatus =
            order.OrderStatus.Trim();

        // ---------------------------------------------------------
        // No change
        // ---------------------------------------------------------

        if (string.Equals(
            currentStatus,
            status,
            StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // ---------------------------------------------------------
        // Validate Status Transition
        // ---------------------------------------------------------

        if (!IsValidStatusTransition(
            currentStatus,
            status))
        {
            throw new ArgumentException(
                $"Order cannot be changed from '{currentStatus}' to '{status}'.");
        }

        // ---------------------------------------------------------
        // Cancellation
        // ---------------------------------------------------------

        if (status.Equals(
            "Cancelled",
            StringComparison.OrdinalIgnoreCase))
        {
            return await CancelAsync(
                orderId,
                note);
        }

        // ---------------------------------------------------------
        // Update Status
        // ---------------------------------------------------------

        order.OrderStatus =
            status;

        order.UpdatedAt =
            DateTime.UtcNow;

        var history =
            new OrderStatusHistory
            {
                OrderId =
                    order.Id,

                Status =
                    status,

                Note =
                    note?.Trim() ??
                    $"Order status changed from '{currentStatus}' to '{status}'.",

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted = false
            };

        _context.OrderStatusHistories.Add(
            history);

        await _context.SaveChangesAsync();

        return true;
    }

    // =========================================================
    // CANCEL ORDER
    // =========================================================

    public async Task<bool> CancelAsync(
        int orderId,
        string? note = null)
    {
        var order =
            await _context.Orders
                .Include(x => x.OrderItems)
                .FirstOrDefaultAsync(x =>
                    x.Id == orderId &&
                    !x.IsDeleted);

        if (order is null)
        {
            return false;
        }

        if (order.OrderStatus == "Cancelled")
        {
            return true;
        }

        if (order.OrderStatus == "Delivered")
        {
            throw new ArgumentException(
                "Delivered order cannot be cancelled.");
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            // -------------------------------------------------
            // Release Reserved Inventory
            // -------------------------------------------------

            foreach (var item in order.OrderItems)
            {
                if (!item.ProductVariantId.HasValue)
                {
                    continue;
                }

                var variant =
                    await _context.ProductVariants
                        .FirstOrDefaultAsync(x =>
                            x.Id ==
                            item.ProductVariantId.Value &&
                            !x.IsDeleted);

                if (variant is null ||
                    !variant.TrackInventory)
                {
                    continue;
                }

                var releaseDto =
                    new ReleaseStockDto
                    {
                        Quantity =
                            item.Quantity,

                        ReferenceType =
                            "OrderCancellation",

                        ReferenceId =
                            order.OrderNumber,

                        Note =
                            "Reserved stock released because order was cancelled."
                    };

                await _inventoryService
                    .ReleaseStockInTransactionAsync(
                        variant.Id,
                        releaseDto);
            }

            // -------------------------------------------------
            // Update Order
            // -------------------------------------------------

            order.OrderStatus =
                "Cancelled";

            order.UpdatedAt =
                DateTime.UtcNow;

            // -------------------------------------------------
            // Status History
            // -------------------------------------------------

            var history =
                new OrderStatusHistory
                {
                    OrderId =
                        order.Id,

                    Status =
                        "Cancelled",

                    Note =
                        note?.Trim() ??
                        "Order cancelled.",

                    CreatedAt =
                        DateTime.UtcNow,

                    IsDeleted = false
                };

            _context.OrderStatusHistories.Add(
                history);

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }



    private static bool IsValidStatusTransition(
    string currentStatus,
    string newStatus)
    {
        currentStatus =
            currentStatus.Trim();

        newStatus =
            newStatus.Trim();

        return currentStatus switch
        {
            "Pending" =>
                newStatus == "Confirmed" ||
                newStatus == "Cancelled",

            "Confirmed" =>
                newStatus == "Processing" ||
                newStatus == "Cancelled",

            "Processing" =>
                newStatus == "Shipped" ||
                newStatus == "Cancelled",

            "Shipped" =>
                newStatus == "Delivered",

            "Delivered" =>
                false,

            "Cancelled" =>
                false,

            _ =>
                false
        };
    }

    // =========================================================
    // VALIDATE ORDER REQUEST
    // =========================================================

    private static void ValidateOrderRequest(
        CreateOrderDto dto)
    {
        if (dto.Items is null ||
            dto.Items.Count == 0)
        {
            throw new ArgumentException(
                "Order must contain at least one item.");
        }

        if (string.IsNullOrWhiteSpace(
            dto.ShippingName))
        {
            throw new ArgumentException(
                "Shipping name is required.");
        }

        if (string.IsNullOrWhiteSpace(
            dto.ShippingPhone))
        {
            throw new ArgumentException(
                "Shipping phone is required.");
        }

        if (string.IsNullOrWhiteSpace(
            dto.ShippingAddress))
        {
            throw new ArgumentException(
                "Shipping address is required.");
        }

        if (string.IsNullOrWhiteSpace(
            dto.PaymentMethod))
        {
            throw new ArgumentException(
                "Payment method is required.");
        }

        if (!dto.CustomerId.HasValue)
        {
            if (string.IsNullOrWhiteSpace(
                dto.GuestName))
            {
                throw new ArgumentException(
                    "Guest name is required for guest checkout.");
            }

            if (string.IsNullOrWhiteSpace(
                dto.GuestPhone))
            {
                throw new ArgumentException(
                    "Guest phone is required for guest checkout.");
            }
        }
    }

    // =========================================================
    // GENERATE ORDER NUMBER
    // =========================================================

    private async Task<string>
        GenerateOrderNumberAsync()
    {
        var date =
            DateTime.UtcNow.ToString(
                "yyyyMMdd");

        var prefix =
            $"ORD-{date}-";

        var lastOrderNumber =
            await _context.Orders
                .Where(x =>
                    x.OrderNumber.StartsWith(
                        prefix))
                .OrderByDescending(x => x.Id)
                .Select(x => x.OrderNumber)
                .FirstOrDefaultAsync();

        var nextNumber = 1;

        if (!string.IsNullOrWhiteSpace(
            lastOrderNumber))
        {
            var lastPart =
                lastOrderNumber
                    .Split('-')
                    .Last();

            if (int.TryParse(
                lastPart,
                out var lastNumber))
            {
                nextNumber =
                    lastNumber + 1;
            }
        }

        return
            $"{prefix}{nextNumber:D5}";
    }

    // =========================================================
    // MAP ORDER TO DTO
    // =========================================================

    private static OrderDto MapToDto(
        Domain.Entities.Order order)
    {
        return new OrderDto
        {
            Id =
                order.Id,

            OrderNumber =
                order.OrderNumber,

            CustomerId =
                order.CustomerId,

            GuestName =
                order.GuestName,

            GuestPhone =
                order.GuestPhone,

            GuestEmail =
                order.GuestEmail,

            SubTotal =
                order.SubTotal,

            DiscountAmount =
                order.DiscountAmount,

            ShippingAmount =
                order.ShippingAmount,

            TaxAmount =
                order.TaxAmount,

            GrandTotal =
                order.GrandTotal,

            OrderStatus =
                order.OrderStatus,

            PaymentStatus =
                order.PaymentStatus,

            PaymentMethod =
                order.PaymentMethod,

            ShippingName =
                order.ShippingName,

            ShippingPhone =
                order.ShippingPhone,

            ShippingAddress =
                order.ShippingAddress,

            ShippingCity =
                order.ShippingCity,

            ShippingArea =
                order.ShippingArea,

            ShippingPostalCode =
                order.ShippingPostalCode,

            CustomerNote =
                order.CustomerNote,

            CreatedAt =
                order.CreatedAt,

            Items =
                order.OrderItems
                    .Select(x =>
                        new OrderItemDto
                        {
                            Id =
                                x.Id,

                            ProductId =
                                x.ProductId,

                            ProductVariantId =
                                x.ProductVariantId,

                            ProductName =
                                x.ProductName,

                            VariantName =
                                x.VariantName,

                            SKU =
                                x.SKU,

                            UnitPrice =
                                x.UnitPrice,

                            DiscountAmount =
                                x.DiscountAmount,

                            Quantity =
                                x.Quantity,

                            TotalPrice =
                                x.TotalPrice
                        })
                    .ToList()
        };
    }

    // =========================================================
    // GET CUSTOMER ORDERS
    // =========================================================

    public async Task<IReadOnlyList<OrderDto>> GetCustomerOrdersAsync(
        int customerId)
    {
        if (customerId <= 0)
        {
            throw new ArgumentException(
                "Invalid customer ID.");
        }

        var orders =
            await _context.Orders
                .AsNoTracking()
                .Include(x => x.OrderItems)
                .Where(x =>
                    x.CustomerId == customerId &&
                    !x.IsDeleted)
                .OrderByDescending(x =>
                    x.CreatedAt)
                .ToListAsync();

        return orders
            .Select(MapToDto)
            .ToList();
    }



    // =========================================================
    // GET CUSTOMER ORDER BY ID
    // =========================================================

    public async Task<OrderDto?> GetCustomerOrderByIdAsync(
        int customerId,
        int orderId)
    {
        if (customerId <= 0)
        {
            throw new ArgumentException(
                "Invalid customer ID.");
        }

        if (orderId <= 0)
        {
            throw new ArgumentException(
                "Invalid order ID.");
        }

        var order =
            await _context.Orders
                .AsNoTracking()
                .Include(x => x.OrderItems)
                .FirstOrDefaultAsync(x =>
                    x.Id == orderId &&
                    x.CustomerId == customerId &&
                    !x.IsDeleted);

        if (order is null)
        {
            return null;
        }

        return MapToDto(order);
    }


}