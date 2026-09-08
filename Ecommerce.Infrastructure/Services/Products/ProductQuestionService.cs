using Ecommerce.Application.DTOs.ProductQuestions;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.Products;

public class ProductQuestionService : IProductQuestionService
{
    private readonly ApplicationDbContext _context;

    public ProductQuestionService(ApplicationDbContext context) => _context = context;

    public async Task<IEnumerable<ProductQuestionDto>> GetByProductIdAsync(int productId)
    {
        return await _context.Set<ProductQuestion>()
            .AsNoTracking()
            .Where(x => x.ProductId == productId && x.IsApproved && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new ProductQuestionDto
            {
                Id = x.Id,
                ProductId = x.ProductId,
                CustomerId = x.CustomerId,
                CustomerName = x.Customer.FirstName + (string.IsNullOrWhiteSpace(x.Customer.LastName) ? "" : " " + x.Customer.LastName),
                Question = x.Question,
                Answer = x.Answer,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<ProductQuestionDto?> CreateAsync(int productId, int customerId, CreateProductQuestionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Question)) throw new ArgumentException("Question is required.");
        if (!await _context.Products.AnyAsync(x => x.Id == productId && x.IsActive && !x.IsDeleted)) return null;
        if (!await _context.Customers.AnyAsync(x => x.Id == customerId && x.IsActive && !x.IsDeleted)) return null;

        var question = new ProductQuestion
        {
            ProductId = productId,
            CustomerId = customerId,
            Question = dto.Question.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsApproved = true,
            IsDeleted = false
        };
        _context.Add(question);
        await _context.SaveChangesAsync();
        return (await GetByProductIdAsync(productId)).First(x => x.Id == question.Id);
    }
}
