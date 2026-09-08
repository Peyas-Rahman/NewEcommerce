namespace Ecommerce.Application.DTOs.ProductQuestions;

public class ProductQuestionDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string? Answer { get; set; }
    public DateTime CreatedAt { get; set; }
}
