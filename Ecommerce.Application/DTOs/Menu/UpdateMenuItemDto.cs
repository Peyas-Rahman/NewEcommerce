namespace Ecommerce.Application.DTOs.Menu;

public class UpdateMenuItemDto
{
    public string Title { get; set; } = string.Empty;

    public string? Url { get; set; }

    public string? Icon { get; set; }

    public string? BadgeText { get; set; }

    public string? BadgeType { get; set; }

    public int? CategoryId { get; set; }

    public int? ParentMenuItemId { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; }

    public bool ShowInHeader { get; set; }

    public bool OpenInNewTab { get; set; }
}