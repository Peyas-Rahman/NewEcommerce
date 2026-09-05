namespace Ecommerce.Application.DTOs.Menus;

public class HeaderMenuSettingDto
{
    public int Id { get; set; }

    public string Alignment { get; set; } = "Left";

    public string Spacing { get; set; } = "Normal";

    public bool ShowAllCategories { get; set; }

    public bool ShowDeals { get; set; }

    public bool IsSticky { get; set; }

    public bool IsActive { get; set; }
}