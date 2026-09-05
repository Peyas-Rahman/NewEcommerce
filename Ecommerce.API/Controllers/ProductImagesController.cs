using Ecommerce.Application.DTOs.ProductImages;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/products/{productId:int}/images")]
public class ProductImagesController : ControllerBase
{
    private readonly IProductImageService _imageService;
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public ProductImagesController(
        IProductImageService imageService,
        ApplicationDbContext context,
        IWebHostEnvironment environment)
    {
        _imageService = imageService;
        _context = context;
        _environment = environment;
    }

    // GET
    [HttpGet]
    public async Task<IActionResult> GetByProductId(
        int productId)
    {
        var images =
            await _imageService
                .GetByProductIdAsync(productId);

        return Ok(images);
    }

    // GET BY ID
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(
        int productId,
        int id)
    {
        var image =
            await _imageService
                .GetByIdAsync(id);

        if (image == null ||
            image.ProductId != productId)
        {
            return NotFound();
        }

        return Ok(image);
    }

    // UPLOAD
    [HttpPost("upload")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        int productId,
        IFormFile file,
        [FromForm] string? altText,
        [FromForm] bool isPrimary = false,
        [FromForm] int sortOrder = 0)
    {
        try
        {
            if (file == null ||
                file.Length == 0)
            {
                return BadRequest(new
                {
                    message =
                        "Please select an image."
                });
            }

            var productExists =
                await _context.Products
                    .AsNoTracking()
                    .AnyAsync(x =>
                        x.Id == productId &&
                        !x.IsDeleted &&
                        x.IsActive);

            if (!productExists)
            {
                return NotFound(new
                {
                    message =
                        "Product not found."
                });
            }

            var allowed =
                new[]
                {
                    ".jpg",
                    ".jpeg",
                    ".png",
                    ".webp"
                };

            var extension =
                Path.GetExtension(
                    file.FileName)
                    .ToLowerInvariant();

            if (!allowed.Contains(extension))
            {
                return BadRequest(new
                {
                    message =
                        "Only JPG, JPEG, PNG and WEBP images are allowed."
                });
            }

            var webRoot =
                _environment.WebRootPath;

            if (string.IsNullOrWhiteSpace(
                    webRoot))
            {
                webRoot =
                    Path.Combine(
                        Directory.GetCurrentDirectory(),
                        "wwwroot");
            }

            var folder =
                Path.Combine(
                    webRoot,
                    "uploads",
                    "products",
                    productId.ToString());

            Directory.CreateDirectory(folder);

            var fileName =
                $"{Guid.NewGuid():N}{extension}";

            var physicalPath =
                Path.Combine(
                    folder,
                    fileName);

            await using (
                var stream =
                    new FileStream(
                        physicalPath,
                        FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl =
                $"/uploads/products/{productId}/{fileName}";

            var dto =
                new CreateProductImageDto
                {
                    ImageUrl = imageUrl,

                    AltText =
                        string.IsNullOrWhiteSpace(
                            altText)
                            ? null
                            : altText.Trim(),

                    IsPrimary =
                        isPrimary,

                    SortOrder =
                        sortOrder
                };

            var image =
                await _imageService
                    .CreateAsync(
                        productId,
                        dto);

            if (image == null)
            {
                if (
                    System.IO.File.Exists(
                        physicalPath))
                {
                    System.IO.File.Delete(
                        physicalPath);
                }

                return BadRequest(new
                {
                    message =
                        "Could not save image."
                });
            }

            return Ok(image);
        }
        catch (Exception ex)
        {
            return StatusCode(
                500,
                new
                {
                    message =
                        "Image upload failed.",
                    detail =
                        ex.Message
                });
        }
    }

    // CREATE URL
    [HttpPost]
    public async Task<IActionResult> Create(
        int productId,
        [FromBody] CreateProductImageDto dto)
    {
        try
        {
            var image =
                await _imageService
                    .CreateAsync(
                        productId,
                        dto);

            if (image == null)
            {
                return NotFound();
            }

            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    productId,
                    id = image.Id
                },
                image);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // UPDATE
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int productId,
        int id,
        [FromBody] UpdateProductImageDto dto)
    {
        var existing =
            await _imageService
                .GetByIdAsync(id);

        if (existing == null ||
            existing.ProductId != productId)
        {
            return NotFound();
        }

        var image =
            await _imageService
                .UpdateAsync(
                    id,
                    dto);

        if (image == null)
            return NotFound();

        return Ok(image);
    }

    // DELETE
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int productId,
        int id)
    {
        var existing =
            await _imageService
                .GetByIdAsync(id);

        if (existing == null ||
            existing.ProductId != productId)
        {
            return NotFound();
        }

        var deleted =
            await _imageService
                .DeleteAsync(id);

        if (!deleted)
            return NotFound();

        return NoContent();
    }
}