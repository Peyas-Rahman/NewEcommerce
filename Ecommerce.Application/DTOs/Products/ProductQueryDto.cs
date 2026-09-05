namespace Ecommerce.Application.DTOs.Products;

public class ProductQueryDto
{
    // Search
    public string? Search { get; set; }

    // Filters
    public int? CategoryId { get; set; }

    public int? BrandId { get; set; }

    public decimal? MinPrice { get; set; }

    public decimal? MaxPrice { get; set; }

    // Product flags
    public bool? IsFeatured { get; set; }

    public bool? IsBestSeller { get; set; }

    public bool? IsNewArrival { get; set; }

    // Sorting
    public string SortBy { get; set; } = "newest";

    // Pagination
    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 20;
}