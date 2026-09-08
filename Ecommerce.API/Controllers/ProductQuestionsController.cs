using System.Security.Claims;
using Ecommerce.Application.DTOs.ProductQuestions;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/products/{productId:int}/questions")]
public class ProductQuestionsController : ControllerBase
{
    private readonly IProductQuestionService _service;
    public ProductQuestionsController(IProductQuestionService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Get(int productId) => Ok(await _service.GetByProductIdAsync(productId));

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(int productId, CreateProductQuestionDto dto)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var customerId)) return Unauthorized();
        try
        {
            var question = await _service.CreateAsync(productId, customerId, dto);
            return question is null ? NotFound(new { message = "Product or customer not found." }) : Ok(question);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
