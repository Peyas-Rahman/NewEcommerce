namespace Ecommerce.Application.DTOs.Brands;

public class CreateBrandDto
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? LogoUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; }
}