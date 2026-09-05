using Ecommerce.Application.DTOs.Customer;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.Customers;

public class CustomerWishlistService
    : ICustomerWishlistService
{
    private readonly ApplicationDbContext _context;

    public CustomerWishlistService(
        ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET MY WISHLIST
    // =========================================================

    public async Task<IReadOnlyList<CustomerWishlistDto>>
        GetMyWishlistAsync(
            int customerId)
    {
        if (customerId <= 0)
        {
            throw new ArgumentException(
                "Invalid customer ID.");
        }

        return await _context.CustomerWishlists
            .AsNoTracking()
            .Where(x =>
                x.CustomerId == customerId &&
                !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new CustomerWishlistDto
            {
                Id =
                    x.Id,

                ProductId =
                    x.ProductId,

                ProductName =
                    x.Product.Name,

                ImageUrl =
                    x.Product.Images
                        .OrderBy(i => i.Id)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault(),

                Price =
                    x.Product.Variants
                        .Where(v => v.IsActive)
                        .OrderBy(v => v.Id)
                        .Select(v => v.Price ?? 0m)
                        .FirstOrDefault(),

                CreatedAt =
                    x.CreatedAt
            })
            .ToListAsync();
    }

    // =========================================================
    // ADD TO WISHLIST
    // =========================================================

    public async Task<CustomerWishlistDto?>
        AddAsync(
            int customerId,
            int productId)
    {
        if (customerId <= 0)
        {
            throw new ArgumentException(
                "Invalid customer ID.");
        }

        if (productId <= 0)
        {
            throw new ArgumentException(
                "Invalid product ID.");
        }

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

        var productExists =
            await _context.Products
                .AsNoTracking()
                .AnyAsync(x =>
                    x.Id == productId &&
                    !x.IsDeleted);

        if (!productExists)
        {
            throw new ArgumentException(
                "Product not found.");
        }

        var existing =
            await _context.CustomerWishlists
                .FirstOrDefaultAsync(x =>
                    x.CustomerId == customerId &&
                    x.ProductId == productId);

        // -------------------------------------------------
        // Already exists and active
        // -------------------------------------------------

        if (existing is not null &&
            !existing.IsDeleted)
        {
            return await GetByIdAsync(
                existing.Id,
                customerId);
        }

        // -------------------------------------------------
        // Previously deleted → restore it
        // -------------------------------------------------

        if (existing is not null &&
            existing.IsDeleted)
        {
            existing.IsDeleted = false;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await GetByIdAsync(
                existing.Id,
                customerId);
        }

        // -------------------------------------------------
        // New wishlist item
        // -------------------------------------------------

        var wishlist =
            new CustomerWishlist
            {
                CustomerId =
                    customerId,

                ProductId =
                    productId,

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        _context.CustomerWishlists.Add(
            wishlist);

        await _context.SaveChangesAsync();

        return await GetByIdAsync(
            wishlist.Id,
            customerId);
    }

    // =========================================================
    // REMOVE FROM WISHLIST
    // =========================================================

    public async Task<bool>
        RemoveAsync(
            int customerId,
            int productId)
    {
        if (customerId <= 0)
        {
            throw new ArgumentException(
                "Invalid customer ID.");
        }

        if (productId <= 0)
        {
            throw new ArgumentException(
                "Invalid product ID.");
        }

        var wishlist =
            await _context.CustomerWishlists
                .FirstOrDefaultAsync(x =>
                    x.CustomerId == customerId &&
                    x.ProductId == productId &&
                    !x.IsDeleted);

        if (wishlist is null)
        {
            return false;
        }

        wishlist.IsDeleted =
            true;

        wishlist.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    // =========================================================
    // GET SINGLE WISHLIST ITEM
    // =========================================================

    private async Task<CustomerWishlistDto?>
        GetByIdAsync(
            int wishlistId,
            int customerId)
    {
        return await _context.CustomerWishlists
            .AsNoTracking()
            .Where(x =>
                x.Id == wishlistId &&
                x.CustomerId == customerId &&
                !x.IsDeleted)
            .Select(x => new CustomerWishlistDto
            {
                Id =
                    x.Id,

                ProductId =
                    x.ProductId,

                ProductName =
                    x.Product.Name,

                ImageUrl =
                    x.Product.Images
                        .OrderBy(i => i.Id)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault(),

                Price =
                    x.Product.Variants
                        .Where(v => v.IsActive)
                        .OrderBy(v => v.Id)
                        .Select(v => v.Price ?? 0m)
                        .FirstOrDefault(),

                CreatedAt =
                    x.CreatedAt
            })
            .FirstOrDefaultAsync();
    }
}