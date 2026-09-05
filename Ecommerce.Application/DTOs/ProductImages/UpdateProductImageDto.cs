namespace Ecommerce.Application.DTOs.ProductImages;

public class UpdateProductImageDto
{
    public string ImageUrl { get; set; } = string.Empty;

    public string? AltText { get; set; }

    public bool IsPrimary { get; set; }

    public int SortOrder { get; set; }
}