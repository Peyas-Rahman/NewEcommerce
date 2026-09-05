namespace Ecommerce.Domain.Entities;

public class HeaderMenuSetting : BaseEntity
{
    public string Alignment { get; set; } = "Left";

    public string Spacing { get; set; } = "Normal";

    public bool ShowAllCategories { get; set; } = true;

    public bool ShowDeals { get; set; } = true;

    public bool IsSticky { get; set; } = true;

    public bool IsActive { get; set; } = true;
}