using Ecommerce.Application.DTOs.Checkout;
using Ecommerce.Application.DTOs.Order;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.Checkout;

public class CheckoutService : ICheckoutService
{
    private readonly ApplicationDbContext _context;
    private readonly IOrderService _orderService;

    public CheckoutService(
        ApplicationDbContext context,
        IOrderService orderService)
    {
        _context = context;
        _orderService = orderService;
    }

    // =========================================================
    // CHECKOUT
    // =========================================================

    public async Task<OrderDto> CheckoutAsync(
        CheckoutDto dto)
    {
        // -----------------------------------------------------
        // Validate Customer / Guest
        // -----------------------------------------------------

        if (!dto.CustomerId.HasValue &&
            string.IsNullOrWhiteSpace(dto.GuestToken))
        {
            throw new ArgumentException(
                "Customer ID or Guest Token is required.");
        }

        // -----------------------------------------------------
        // Validate Customer
        // -----------------------------------------------------

        if (dto.CustomerId.HasValue &&
            dto.CustomerId.Value <= 0)
        {
            throw new ArgumentException(
                "Invalid customer ID.");
        }

        // -----------------------------------------------------
        // Find Cart
        // -----------------------------------------------------

        var cartQuery = _context.Carts
            .AsNoTracking()
            .Where(x =>
                x.IsActive &&
                !x.IsDeleted);

        if (dto.CustomerId.HasValue)
        {
            cartQuery = cartQuery.Where(x =>
                x.CustomerId ==
                dto.CustomerId.Value);
        }
        else
        {
            cartQuery = cartQuery.Where(x =>
                x.GuestToken ==
                dto.GuestToken);
        }

        var cart = await cartQuery
            .Select(x => new
            {
                x.Id,
                x.CustomerId,
                x.GuestToken
            })
            .FirstOrDefaultAsync();

        if (cart is null)
        {
            throw new ArgumentException(
                "Cart not found.");
        }

        // -----------------------------------------------------
        // Get Cart Items
        // -----------------------------------------------------

        var cartItems =
            await _context.CartItems
                .AsNoTracking()
                .Where(x =>
                    x.CartId == cart.Id &&
                    !x.IsDeleted)
                .OrderBy(x => x.Id)
                .ToListAsync();

        if (cartItems.Count == 0)
        {
            throw new ArgumentException(
                "Cart is empty.");
        }

        // -----------------------------------------------------
        // Validate Cart Items
        // -----------------------------------------------------

        var productIds =
            cartItems
                .Select(x => x.ProductId)
                .Distinct()
                .ToList();

        var variantIds =
            cartItems
                .Where(x =>
                    x.ProductVariantId.HasValue)
                .Select(x =>
                    x.ProductVariantId!.Value)
                .Distinct()
                .ToList();

        // -----------------------------------------------------
        // Load Products
        // -----------------------------------------------------

        var products =
            await _context.Products
                .AsNoTracking()
                .Where(x =>
                    productIds.Contains(x.Id) &&
                    x.IsActive &&
                    !x.IsDeleted)
                .ToDictionaryAsync(
                    x => x.Id);

        // -----------------------------------------------------
        // Load Variants
        // -----------------------------------------------------

        var variants =
            await _context.ProductVariants
                .AsNoTracking()
                .Where(x =>
                    variantIds.Contains(x.Id) &&
                    x.IsActive &&
                    !x.IsDeleted)
                .ToDictionaryAsync(
                    x => x.Id);

        // -----------------------------------------------------
        // Validate Products / Variants
        // -----------------------------------------------------

        foreach (var cartItem in cartItems)
        {
            if (cartItem.Quantity <= 0)
            {
                throw new ArgumentException(
                    $"Invalid quantity for product ID {cartItem.ProductId}.");
            }

            if (!products.TryGetValue(
                cartItem.ProductId,
                out var product))
            {
                throw new ArgumentException(
                    $"Product with ID {cartItem.ProductId} is no longer available.");
            }

            if (cartItem.ProductVariantId.HasValue)
            {
                if (!variants.TryGetValue(
                    cartItem.ProductVariantId.Value,
                    out var variant))
                {
                    throw new ArgumentException(
                        $"Product variant for {product.Name} is no longer available.");
                }

                if (variant.ProductId !=
                    cartItem.ProductId)
                {
                    throw new ArgumentException(
                        $"Invalid variant for product {product.Name}.");
                }
            }
        }

        // -----------------------------------------------------
        // Build Order Items
        // -----------------------------------------------------

        var orderItems =
            new List<CreateOrderItemDto>();

        foreach (var cartItem in cartItems)
        {
            orderItems.Add(
                new CreateOrderItemDto
                {
                    ProductId =
                        cartItem.ProductId,

                    ProductVariantId =
                        cartItem.ProductVariantId,

                    Quantity =
                        cartItem.Quantity
                });
        }

        // -----------------------------------------------------
        // Create Order DTO
        // -----------------------------------------------------

        var createOrderDto =
            new CreateOrderDto
            {
                CustomerId =
                    dto.CustomerId,

                GuestName =
                    dto.GuestName?.Trim(),

                GuestPhone =
                    dto.GuestPhone?.Trim(),

                GuestEmail =
                    dto.GuestEmail?.Trim(),

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

                PaymentMethod =
                    dto.PaymentMethod.Trim(),

                CustomerNote =
                    dto.CustomerNote?.Trim(),

                Items =
                    orderItems
            };

        // -----------------------------------------------------
        // Create Order
        //
        // OrderService handles:
        // - Price calculation
        // - Inventory reservation
        // - Order creation
        // - Order items
        // - Status history
        // -----------------------------------------------------

        var order =
            await _orderService.CreateAsync(
                createOrderDto);

        if (order is null)
        {
            throw new InvalidOperationException(
                "Order could not be created.");
        }

        // -----------------------------------------------------
        // Clear Cart
        // -----------------------------------------------------

        await ClearCartAsync(
            cart.Id);

        return order;
    }

    // =========================================================
    // CLEAR CART
    // =========================================================

    private async Task ClearCartAsync(
        int cartId)
    {
        var items =
            await _context.CartItems
                .Where(x =>
                    x.CartId == cartId &&
                    !x.IsDeleted)
                .ToListAsync();

        if (items.Count == 0)
        {
            return;
        }

        var now =
            DateTime.UtcNow;

        foreach (var item in items)
        {
            item.IsDeleted =
                true;

            item.UpdatedAt =
                now;
        }

        await _context.SaveChangesAsync();
    }
}