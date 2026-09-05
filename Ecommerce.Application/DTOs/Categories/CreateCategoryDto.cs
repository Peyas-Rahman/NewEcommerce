namespace Ecommerce.Application.DTOs.Categories;

public class CreateCategoryDto
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? ImageUrl { get; set; }

    public int? ParentCategoryId { get; set; }

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; }
}