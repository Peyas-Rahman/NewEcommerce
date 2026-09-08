using Ecommerce.Application.DTOs.ProductReviews;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.Products;

public class ProductReviewService : IProductReviewService
{
    private readonly ApplicationDbContext _context;

    public ProductReviewService(ApplicationDbContext context) => _context = context;

    public async Task<IEnumerable<ProductReviewDto>> GetByProductIdAsync(int productId)
    {
        return await _context.Set<ProductReview>()
            .AsNoTracking()
            .Where(x => x.ProductId == productId && x.IsApproved && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new ProductReviewDto
            {
                Id = x.Id,
                ProductId = x.ProductId,
                CustomerId = x.CustomerId,
                CustomerName = x.Customer.FirstName + (string.IsNullOrWhiteSpace(x.Customer.LastName) ? "" : " " + x.Customer.LastName),
                Rating = x.Rating,
                Title = x.Title,
                Comment = x.Comment,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<ProductReviewDto?> CreateAsync(int productId, int customerId, CreateProductReviewDto dto)
    {
        if (dto.Rating < 1 || dto.Rating > 5) throw new ArgumentException("Rating must be between 1 and 5.");
        if (string.IsNullOrWhiteSpace(dto.Comment)) throw new ArgumentException("Review comment is required.");
        if (!await _context.Products.AnyAsync(x => x.Id == productId && x.IsActive && !x.IsDeleted)) return null;
        if (!await _context.Customers.AnyAsync(x => x.Id == customerId && x.IsActive && !x.IsDeleted)) return null;
        if (await _context.Set<ProductReview>().AnyAsync(x => x.ProductId == productId && x.CustomerId == customerId && !x.IsDeleted))
            throw new ArgumentException("You have already reviewed this product.");

        var review = new ProductReview
        {
            ProductId = productId,
            CustomerId = customerId,
            Rating = dto.Rating,
            Title = dto.Title?.Trim() ?? string.Empty,
            Comment = dto.Comment.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsApproved = true,
            IsDeleted = false
        };
        _context.Add(review);
        await _context.SaveChangesAsync();
        return (await GetByProductIdAsync(productId)).First(x => x.Id == review.Id);
    }
}
