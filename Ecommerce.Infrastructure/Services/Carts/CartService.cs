using Ecommerce.Application.DTOs.Cart;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.Carts;

public class CartService : ICartService
{
    private readonly ApplicationDbContext _context;

    public CartService(ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET OR CREATE CART
    // =========================================================

    public async Task<CartDto> GetOrCreateCartAsync(
        int? customerId,
        string? guestToken)
    {
        Cart? cart = null;

        if (customerId.HasValue)
        {
            cart = await _context.Carts
                .FirstOrDefaultAsync(x =>
                    x.CustomerId == customerId.Value &&
                    x.IsActive &&
                    !x.IsDeleted);
        }
        else if (!string.IsNullOrWhiteSpace(guestToken))
        {
            cart = await _context.Carts
                .FirstOrDefaultAsync(x =>
                    x.GuestToken == guestToken &&
                    x.IsActive &&
                    !x.IsDeleted);
        }

        if (cart is null)
        {
            cart = new Cart
            {
                CustomerId = customerId,

                GuestToken = customerId.HasValue
                    ? null
                    : guestToken ?? GenerateGuestToken(),

                IsActive = true,

                CreatedAt = DateTime.UtcNow,

                IsDeleted = false
            };

            _context.Carts.Add(cart);

            await _context.SaveChangesAsync();
        }

        return await BuildCartDtoAsync(cart.Id);
    }

    // =========================================================
    // ADD ITEM TO CART
    // =========================================================

    public async Task<CartDto> AddItemAsync(
        int? customerId,
        string? guestToken,
        AddToCartDto dto)
    {
        if (dto.Quantity <= 0)
        {
            throw new ArgumentException(
                "Quantity must be greater than zero.");
        }

        // -----------------------------------------------------
        // Validate Product
        // -----------------------------------------------------

        var product = await _context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.Id == dto.ProductId &&
                x.IsActive &&
                !x.IsDeleted);

        if (product is null)
        {
            throw new ArgumentException(
                "Product not found.");
        }

        // -----------------------------------------------------
        // Validate Variant
        // -----------------------------------------------------

        ProductVariant? variant = null;

        if (dto.ProductVariantId.HasValue)
        {
            variant = await _context.ProductVariants
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Id == dto.ProductVariantId.Value &&
                    x.ProductId == dto.ProductId &&
                    x.IsActive &&
                    !x.IsDeleted);

            if (variant is null)
            {
                throw new ArgumentException(
                    "Product variant not found.");
            }
        }

        // -----------------------------------------------------
        // Get/Create Cart
        // -----------------------------------------------------

        var cart = await GetOrCreateCartEntityAsync(
            customerId,
            guestToken);

        // -----------------------------------------------------
        // Check Existing Item
        // -----------------------------------------------------

        // -----------------------------------------------------
        // Check Existing Active Item
        // -----------------------------------------------------

        var existingItem =
            await _context.CartItems
                .FirstOrDefaultAsync(x =>
                    x.CartId == cart.Id &&
                    x.ProductId == dto.ProductId &&
                    x.ProductVariantId ==
                        dto.ProductVariantId &&
                    !x.IsDeleted);

        if (existingItem is not null)
        {
            // -------------------------------------------------
            // Active item already exists
            // Increase quantity
            // -------------------------------------------------

            existingItem.Quantity +=
                dto.Quantity;

            existingItem.UpdatedAt =
                DateTime.UtcNow;
        }
        else
        {
            // -------------------------------------------------
            // Check Soft Deleted Item
            // -------------------------------------------------

            var deletedItem =
                await _context.CartItems
                    .FirstOrDefaultAsync(x =>
                        x.CartId == cart.Id &&
                        x.ProductId == dto.ProductId &&
                        x.ProductVariantId ==
                            dto.ProductVariantId &&
                        x.IsDeleted);

            if (deletedItem is not null)
            {
                // -------------------------------------------------
                // Restore Soft Deleted Item
                // -------------------------------------------------

                deletedItem.IsDeleted = false;

                deletedItem.Quantity =
                    dto.Quantity;

                deletedItem.UpdatedAt =
                    DateTime.UtcNow;
            }
            else
            {
                // -------------------------------------------------
                // Create New Item
                // -------------------------------------------------

                var cartItem =
                    new CartItem
                    {
                        CartId =
                            cart.Id,

                        ProductId =
                            dto.ProductId,

                        ProductVariantId =
                            dto.ProductVariantId,

                        Quantity =
                            dto.Quantity,

                        CreatedAt =
                            DateTime.UtcNow,

                        IsDeleted =
                            false
                    };

                _context.CartItems.Add(
                    cartItem);
            }
        }

        await _context.SaveChangesAsync();

        return await BuildCartDtoAsync(
            cart.Id);
    }

    // =========================================================
    // UPDATE CART ITEM
    // =========================================================

    public async Task<CartDto?> UpdateItemAsync(
        int cartId,
        int cartItemId,
        UpdateCartItemDto dto)
    {
        if (dto.Quantity <= 0)
        {
            throw new ArgumentException(
                "Quantity must be greater than zero.");
        }

        var cartItem =
            await _context.CartItems
                .FirstOrDefaultAsync(x =>
                    x.Id == cartItemId &&
                    x.CartId == cartId &&
                    !x.IsDeleted);

        if (cartItem is null)
        {
            return null;
        }

        // -----------------------------------------------------
        // Validate Product
        // -----------------------------------------------------

        var productExists =
            await _context.Products
                .AnyAsync(x =>
                    x.Id == cartItem.ProductId &&
                    x.IsActive &&
                    !x.IsDeleted);

        if (!productExists)
        {
            throw new ArgumentException(
                "Product is no longer available.");
        }

        // -----------------------------------------------------
        // Validate Variant
        // -----------------------------------------------------

        if (cartItem.ProductVariantId.HasValue)
        {
            var variantExists =
                await _context.ProductVariants
                    .AnyAsync(x =>
                        x.Id ==
                            cartItem.ProductVariantId.Value &&
                        x.ProductId ==
                            cartItem.ProductId &&
                        x.IsActive &&
                        !x.IsDeleted);

            if (!variantExists)
            {
                throw new ArgumentException(
                    "Product variant is no longer available.");
            }
        }

        cartItem.Quantity =
            dto.Quantity;

        cartItem.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await BuildCartDtoAsync(cartId);
    }

    // =========================================================
    // REMOVE CART ITEM
    // =========================================================

    public async Task<bool> RemoveItemAsync(
        int cartId,
        int cartItemId)
    {
        var cartItem =
            await _context.CartItems
                .FirstOrDefaultAsync(x =>
                    x.Id == cartItemId &&
                    x.CartId == cartId &&
                    !x.IsDeleted);

        if (cartItem is null)
        {
            return false;
        }

        // Soft delete
        cartItem.IsDeleted = true;

        cartItem.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    // =========================================================
    // CLEAR CART
    // =========================================================

    public async Task<bool> ClearCartAsync(
        int cartId)
    {
        var cart =
            await _context.Carts
                .FirstOrDefaultAsync(x =>
                    x.Id == cartId &&
                    !x.IsDeleted);

        if (cart is null)
        {
            return false;
        }

        var items =
            await _context.CartItems
                .Where(x =>
                    x.CartId == cartId &&
                    !x.IsDeleted)
                .ToListAsync();

        foreach (var item in items)
        {
            item.IsDeleted = true;

            item.UpdatedAt =
                DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return true;
    }

    // =========================================================
    // GET OR CREATE CART ENTITY
    // =========================================================

    private async Task<Cart>
        GetOrCreateCartEntityAsync(
            int? customerId,
            string? guestToken)
    {
        Cart? cart = null;

        if (customerId.HasValue)
        {
            cart = await _context.Carts
                .FirstOrDefaultAsync(x =>
                    x.CustomerId == customerId.Value &&
                    x.IsActive &&
                    !x.IsDeleted);
        }
        else if (!string.IsNullOrWhiteSpace(guestToken))
        {
            cart = await _context.Carts
                .FirstOrDefaultAsync(x =>
                    x.GuestToken == guestToken &&
                    x.IsActive &&
                    !x.IsDeleted);
        }

        if (cart is not null)
        {
            return cart;
        }

        // -----------------------------------------------------
        // Create New Cart
        // -----------------------------------------------------

        cart = new Cart
        {
            CustomerId =
                customerId,

            GuestToken =
                customerId.HasValue
                    ? null
                    : guestToken ?? GenerateGuestToken(),

            IsActive = true,

            CreatedAt =
                DateTime.UtcNow,

            IsDeleted = false
        };

        _context.Carts.Add(cart);

        await _context.SaveChangesAsync();

        return cart;
    }

    // =========================================================
    // BUILD CART DTO
    // =========================================================

    private async Task<CartDto> BuildCartDtoAsync(
        int cartId)
    {
        var cart =
            await _context.Carts
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Id == cartId &&
                    !x.IsDeleted);

        if (cart is null)
        {
            throw new InvalidOperationException(
                "Cart not found.");
        }

        var cartItems =
            await _context.CartItems
                .AsNoTracking()
                .Where(x =>
                    x.CartId == cartId &&
                    !x.IsDeleted)
                .ToListAsync();

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
        // Products
        // -----------------------------------------------------

        var products =
            await _context.Products
                .AsNoTracking()
                .Where(x =>
                    productIds.Contains(x.Id))
                .ToDictionaryAsync(
                    x => x.Id);

        // -----------------------------------------------------
        // Variants
        // -----------------------------------------------------

        var variants =
            await _context.ProductVariants
                .AsNoTracking()
                .Where(x =>
                    variantIds.Contains(x.Id))
                .ToDictionaryAsync(
                    x => x.Id);

        // -----------------------------------------------------
        // Primary Images
        // -----------------------------------------------------

        var images =
            await _context.ProductImages
                .AsNoTracking()
                .Where(x =>
                    productIds.Contains(x.ProductId) &&
                    x.IsPrimary)
                .ToListAsync();

        var imageDictionary =
            images
                .GroupBy(x => x.ProductId)
                .ToDictionary(
                    x => x.Key,
                    x => x.First().ImageUrl);

        // -----------------------------------------------------
        // Create DTO
        // -----------------------------------------------------

        var dto = new CartDto
        {
            Id =
                cart.Id,

            CustomerId =
                cart.CustomerId,

            GuestToken =
                cart.GuestToken
        };

        foreach (var item in cartItems)
        {
            if (!products.TryGetValue(
                item.ProductId,
                out var product))
            {
                continue;
            }

            ProductVariant? variant = null;

            if (item.ProductVariantId.HasValue)
            {
                variants.TryGetValue(
                    item.ProductVariantId.Value,
                    out variant);
            }

            // -------------------------------------------------
            // Calculate Current Price
            // -------------------------------------------------

            decimal unitPrice;

            if (variant is not null)
            {
                var variantPrice =
                    variant.Price;

                var variantDiscountPrice =
                    variant.DiscountPrice;

                if (variantDiscountPrice.HasValue &&
                    variantPrice.HasValue &&
                    variantDiscountPrice.Value <
                    variantPrice.Value)
                {
                    unitPrice =
                        variantDiscountPrice.Value;
                }
                else
                {
                    unitPrice =
                        variantPrice.GetValueOrDefault();
                }
            }
            else
            {
                var productPrice =
                    product.Price;

                var productDiscountPrice =
                    product.DiscountPrice;

                if (productDiscountPrice.HasValue &&
                    productDiscountPrice.Value <
                    productPrice)
                {
                    unitPrice =
                        productDiscountPrice.Value;
                }
                else
                {
                    unitPrice =
                        productPrice;
                }
            }

            var totalPrice =
                unitPrice * item.Quantity;

            // -------------------------------------------------
            // Image
            // -------------------------------------------------

            string? imageUrl = null;

            if (imageDictionary.TryGetValue(
                item.ProductId,
                out var foundImage))
            {
                imageUrl = foundImage;
            }

            // -------------------------------------------------
            // Add Cart Item DTO
            // -------------------------------------------------

            dto.Items.Add(
                new CartItemDto
                {
                    Id =
                        item.Id,

                    ProductId =
                        item.ProductId,

                    ProductVariantId =
                        item.ProductVariantId,

                    ProductName =
                        product.Name,

                    VariantName =
                        variant?.Name,

                    SKU =
                        variant?.SKU ??
                        product.SKU,

                    UnitPrice =
                        unitPrice,

                    Quantity =
                        item.Quantity,

                    TotalPrice =
                        totalPrice,

                    ImageUrl =
                        imageUrl
                });
        }

        // -----------------------------------------------------
        // Cart Summary
        // -----------------------------------------------------

        dto.TotalItems =
            dto.Items.Sum(x =>
                x.Quantity);

        dto.SubTotal =
            dto.Items.Sum(x =>
                x.TotalPrice);

        return dto;
    }

    // =========================================================
    // GENERATE GUEST TOKEN
    // =========================================================

    private static string GenerateGuestToken()
    {
        return Guid.NewGuid()
            .ToString("N");
    }

    // =========================================================
    // MERGE GUEST CART INTO CUSTOMER CART
    // =========================================================

    public async Task<CartDto> MergeGuestCartAsync(
        int customerId,
        string guestToken)
    {
        if (customerId <= 0)
        {
            throw new ArgumentException(
                "Invalid customer ID.");
        }

        if (string.IsNullOrWhiteSpace(guestToken))
        {
            throw new ArgumentException(
                "Guest token is required.");
        }

        // -----------------------------------------------------
        // Validate Customer
        // -----------------------------------------------------

        var customerExists =
            await _context.Customers
                .AsNoTracking()
                .AnyAsync(x =>
                    x.Id == customerId &&
                    x.IsActive &&
                    !x.IsDeleted);

        if (!customerExists)
        {
            throw new ArgumentException(
                "Customer not found.");
        }

        // -----------------------------------------------------
        // Find Guest Cart
        // -----------------------------------------------------

        var guestCart =
            await _context.Carts
                .FirstOrDefaultAsync(x =>
                    x.GuestToken == guestToken &&
                    x.IsActive &&
                    !x.IsDeleted);

        if (guestCart is null)
        {
            // No guest cart.
            // Return/create customer cart.
            return await GetOrCreateCartAsync(
                customerId,
                null);
        }

        // -----------------------------------------------------
        // Get/Create Customer Cart
        // -----------------------------------------------------

        var customerCart =
            await _context.Carts
                .FirstOrDefaultAsync(x =>
                    x.CustomerId == customerId &&
                    x.IsActive &&
                    !x.IsDeleted);

        if (customerCart is null)
        {
            customerCart = new Cart
            {
                CustomerId =
                    customerId,

                GuestToken =
                    null,

                IsActive =
                    true,

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

            _context.Carts.Add(customerCart);

            await _context.SaveChangesAsync();
        }

        // -----------------------------------------------------
        // Get Guest Cart Items
        // -----------------------------------------------------

        var guestItems =
            await _context.CartItems
                .Where(x =>
                    x.CartId == guestCart.Id &&
                    !x.IsDeleted)
                .ToListAsync();

        if (guestItems.Count == 0)
        {
            guestCart.IsActive = false;
            guestCart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await BuildCartDtoAsync(
                customerCart.Id);
        }

        // -----------------------------------------------------
        // Transaction
        // -----------------------------------------------------

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            foreach (var guestItem in guestItems)
            {
                // -------------------------------------------------
                // Find same product + variant in customer cart
                // -------------------------------------------------

                var customerItem =
                    await _context.CartItems
                        .FirstOrDefaultAsync(x =>
                            x.CartId ==
                                customerCart.Id &&

                            x.ProductId ==
                                guestItem.ProductId &&

                            x.ProductVariantId ==
                                guestItem.ProductVariantId &&

                            !x.IsDeleted);

                if (customerItem is not null)
                {
                    // Same item already exists.
                    // Add guest quantity.
                    customerItem.Quantity +=
                        guestItem.Quantity;

                    customerItem.UpdatedAt =
                        DateTime.UtcNow;
                }
                else
                {
                    // -------------------------------------------------
                    // New item → copy to customer cart
                    // -------------------------------------------------

                    var newCustomerItem =
                        new CartItem
                        {
                            CartId =
                                customerCart.Id,

                            ProductId =
                                guestItem.ProductId,

                            ProductVariantId =
                                guestItem.ProductVariantId,

                            Quantity =
                                guestItem.Quantity,

                            CreatedAt =
                                DateTime.UtcNow,

                            IsDeleted =
                                false
                        };

                    _context.CartItems.Add(
                        newCustomerItem);
                }

                // -------------------------------------------------
                // Remove item from guest cart
                // -------------------------------------------------

                guestItem.IsDeleted = true;

                guestItem.UpdatedAt =
                    DateTime.UtcNow;
            }

            // -----------------------------------------------------
            // Deactivate Guest Cart
            // -----------------------------------------------------

            guestCart.IsActive =
                false;

            guestCart.IsDeleted =
                true;

            guestCart.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }

        // -----------------------------------------------------
        // Return merged customer cart
        // -----------------------------------------------------

        return await BuildCartDtoAsync(
            customerCart.Id);
    }

}