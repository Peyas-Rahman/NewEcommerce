namespace Ecommerce.Domain.Entities;

public class MenuItem : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public string? Url { get; set; }

    public string? Icon { get; set; }

    public string? BadgeText { get; set; }

    public string? BadgeType { get; set; }

    public int? CategoryId { get; set; }

    public int? ParentMenuItemId { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public bool ShowInHeader { get; set; } = true;

    public bool OpenInNewTab { get; set; } = false;

    public Category? Category { get; set; }

    public MenuItem? ParentMenuItem { get; set; }

    public ICollection<MenuItem> ChildItems { get; set; }
        = new List<MenuItem>();
}