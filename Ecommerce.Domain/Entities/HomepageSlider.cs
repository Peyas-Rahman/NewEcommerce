namespace Ecommerce.Domain.Entities;

public class HomepageSlider : BaseEntity
{
    public string ImageUrl { get; set; } = string.Empty;
    public string Badge { get; set; } = string.Empty;
    public string Eyebrow { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Highlight { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PrimaryButtonText { get; set; } = string.Empty;
    public string PrimaryButtonUrl { get; set; } = "/shop";
    public string SecondaryButtonText { get; set; } = string.Empty;
    public string SecondaryButtonUrl { get; set; } = "/shop";
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
