namespace Ecommerce.Application.DTOs.Products;

public class ProductPagedResultDto
{
    public IReadOnlyList<ProductDto> Items { get; set; }
        = Array.Empty<ProductDto>();

    public int Page { get; set; }

    public int PageSize { get; set; }

    public int TotalItems { get; set; }

    public int TotalPages { get; set; }

    public bool HasPreviousPage =>
        Page > 1;

    public bool HasNextPage =>
        Page < TotalPages;
}