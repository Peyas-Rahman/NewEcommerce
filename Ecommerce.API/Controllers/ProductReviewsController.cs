using System.Security.Claims;
using Ecommerce.Application.DTOs.ProductReviews;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/products/{productId:int}/reviews")]
public class ProductReviewsController : ControllerBase
{
    private readonly IProductReviewService _service;
    public ProductReviewsController(IProductReviewService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Get(int productId) => Ok(await _service.GetByProductIdAsync(productId));

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(int productId, CreateProductReviewDto dto)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var customerId)) return Unauthorized();
        try
        {
            var review = await _service.CreateAsync(productId, customerId, dto);
            return review is null ? NotFound(new { message = "Product or customer not found." }) : Ok(review);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
