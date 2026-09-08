namespace Ecommerce.Application.DTOs.ProductReviews;

public class CreateProductReviewDto
{
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string Comment { get; set; } = string.Empty;
}
