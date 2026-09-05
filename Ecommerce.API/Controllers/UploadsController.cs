using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/uploads")]
public class UploadsController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public UploadsController(
        IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    // POST: /api/uploads/images
    [HttpPost("images")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage(
        IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new
            {
                message = "No image file selected."
            });
        }

        var allowedExtensions = new[]
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };

        var extension =
            Path.GetExtension(file.FileName)
                .ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new
            {
                message =
                    "Only JPG, JPEG, PNG and WEBP images are allowed."
            });
        }

        // =====================================================
        // WWWROOT
        // =====================================================

        var webRootPath =
            _environment.WebRootPath;

        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath =
                Path.Combine(
                    _environment.ContentRootPath,
                    "wwwroot"
                );
        }

        // =====================================================
        // CREATE FOLDER
        // =====================================================

        var uploadPath =
            Path.Combine(
                webRootPath,
                "uploads",
                "images"
            );

        Directory.CreateDirectory(
            uploadPath
        );

        // =====================================================
        // UNIQUE FILE NAME
        // =====================================================

        var fileName =
            $"{Guid.NewGuid():N}{extension}";

        var physicalFilePath =
            Path.Combine(
                uploadPath,
                fileName
            );

        // =====================================================
        // SAVE FILE
        // =====================================================

        await using (
            var stream =
                new FileStream(
                    physicalFilePath,
                    FileMode.CreateNew,
                    FileAccess.Write,
                    FileShare.None
                ))
        {
            await file.CopyToAsync(stream);
        }

        // =====================================================
        // VERIFY FILE
        // =====================================================

        if (!System.IO.File.Exists(
                physicalFilePath))
        {
            return StatusCode(
                500,
                new
                {
                    message =
                        "Image upload failed. File was not saved."
                });
        }

        // =====================================================
        // PUBLIC URL
        // =====================================================

        var imageUrl =
            $"{Request.Scheme}://{Request.Host}/uploads/images/{fileName}";

        return Ok(new
        {
            url = imageUrl,
            imageUrl = imageUrl,
            fileName = fileName
        });
    }
}