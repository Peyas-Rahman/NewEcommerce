using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Brand> Brands => Set<Brand>();

    public DbSet<Product> Products => Set<Product>();

    public DbSet<ProductImage> ProductImages => Set<ProductImage>();

    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();

    public DbSet<Inventory> Inventories { get; set; }

    public DbSet<InventoryTransaction> InventoryTransactions { get; set; }

    public DbSet<Customer> Customers { get; set; }

    public DbSet<Order> Orders { get; set; }

    public DbSet<OrderItem> OrderItems { get; set; }

    public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }

    public DbSet<Cart> Carts { get; set; }

    public DbSet<CartItem> CartItems { get; set; }

    public DbSet<CustomerAddress> CustomerAddresses
    {
        get;
        set;
    }

    public DbSet<CustomerWishlist> CustomerWishlists
    {
        get;
        set;
    }

    public DbSet<Payment> Payments { get; set; }
    public DbSet<HeaderMenuSetting> HeaderMenuSettings { get; set; }




    // =========================================================
    // Menu
    // =========================================================

    public DbSet<MenuItem> MenuItems => Set<MenuItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ApplicationDbContext).Assembly);


        // =====================================================
        // MenuItem → Category
        // =====================================================

        modelBuilder.Entity<MenuItem>()
            .HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);


        // =====================================================
        // MenuItem → Parent MenuItem
        // Self-referencing relationship
        // =====================================================

        modelBuilder.Entity<MenuItem>()
            .HasOne(x => x.ParentMenuItem)
            .WithMany(x => x.ChildItems)
            .HasForeignKey(x => x.ParentMenuItemId)
            .OnDelete(DeleteBehavior.Restrict);


        // =====================================================
        // MenuItem Indexes
        // =====================================================

        modelBuilder.Entity<MenuItem>()
            .HasIndex(x => new
            {
                x.ParentMenuItemId,
                x.SortOrder
            });

        modelBuilder.Entity<MenuItem>()
            .HasIndex(x => new
            {
                x.IsActive,
                x.ShowInHeader
            });
    }
}