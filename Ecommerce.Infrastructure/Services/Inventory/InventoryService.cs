using Ecommerce.Application.DTOs.Inventory;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

using InventoryEntity =
    Ecommerce.Domain.Entities.Inventory;

using InventoryTransactionEntity =
    Ecommerce.Domain.Entities.InventoryTransaction;

namespace Ecommerce.Infrastructure.Services.Inventory;

public class InventoryService : IInventoryService
{
    private readonly ApplicationDbContext _context;

    public InventoryService(
        ApplicationDbContext context)
    {
        _context = context;
    }


    // =========================================================
    // VARIANT INVENTORY
    // =========================================================

    public async Task<InventoryDto?> GetByVariantIdAsync(
        int productVariantId)
    {
        var inventory =
            await _context.Inventories
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.ProductVariantId ==
                        productVariantId &&
                    !x.IsDeleted);

        if (inventory is null)
            return null;

        return MapToDto(inventory);
    }


    public async Task<InventoryDto?> CreateAsync(
        int productVariantId,
        CreateInventoryDto dto)
    {
        ValidateCreate(dto);

        var variant =
            await _context.ProductVariants
                .FirstOrDefaultAsync(x =>
                    x.Id == productVariantId &&
                    !x.IsDeleted);

        if (variant is null)
            return null;

        if (!variant.TrackInventory)
        {
            throw new ArgumentException(
                "Inventory tracking is disabled for this variant.");
        }

        var existingInventory =
            await _context.Inventories
                .FirstOrDefaultAsync(x =>
                    x.ProductVariantId ==
                        productVariantId &&
                    !x.IsDeleted);

        if (existingInventory is not null)
        {
            throw new ArgumentException(
                "Inventory already exists for this variant.");
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            var inventory =
                new InventoryEntity
                {
                    ProductId =
                        variant.ProductId,

                    ProductVariantId =
                        productVariantId,

                    StockQuantity =
                        dto.StockQuantity,

                    ReservedQuantity =
                        dto.ReservedQuantity,

                    ReorderLevel =
                        dto.ReorderLevel,

                    IsActive =
                        dto.IsActive,

                    CreatedAt =
                        DateTime.UtcNow,

                    IsDeleted =
                        false
                };

            _context.Inventories.Add(
                inventory);

            await _context.SaveChangesAsync();

            await CreateInitialTransactionIfNeeded(
                inventory,
                dto.StockQuantity);

            await transaction.CommitAsync();

            return MapToDto(inventory);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }


    public async Task<InventoryDto?> UpdateAsync(
        int productVariantId,
        UpdateInventoryDto dto)
    {
        ValidateUpdate(dto);

        var inventory =
            await _context.Inventories
                .FirstOrDefaultAsync(x =>
                    x.ProductVariantId ==
                        productVariantId &&
                    !x.IsDeleted);

        if (inventory is null)
            return null;

        return await UpdateInventoryInternalAsync(
            inventory,
            dto);
    }


    public async Task<InventoryDto?> AdjustStockAsync(
        int productVariantId,
        InventoryAdjustmentDto dto)
    {
        if (dto.Quantity == 0)
        {
            throw new ArgumentException(
                "Adjustment quantity cannot be zero.");
        }

        var inventory =
            await _context.Inventories
                .FirstOrDefaultAsync(x =>
                    x.ProductVariantId ==
                        productVariantId &&
                    !x.IsDeleted);

        if (inventory is null)
            return null;

        return await AdjustInventoryInternalAsync(
            inventory,
            dto);
    }


    public async Task<IEnumerable<InventoryTransactionDto>>
        GetTransactionsAsync(
            int productVariantId)
    {
        var inventory =
            await _context.Inventories
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.ProductVariantId ==
                        productVariantId &&
                    !x.IsDeleted);

        if (inventory is null)
        {
            return Enumerable.Empty
                <InventoryTransactionDto>();
        }

        return await GetTransactionsByInventoryIdAsync(
            inventory.Id);
    }


    // =========================================================
    // SIMPLE PRODUCT INVENTORY
    // =========================================================

    public async Task<InventoryDto?> GetByProductIdAsync(
        int productId)
    {
        var inventory =
            await _context.Inventories
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.ProductId == productId &&
                    x.ProductVariantId == null &&
                    !x.IsDeleted);

        if (inventory is null)
            return null;

        return MapToDto(inventory);
    }


    public async Task<InventoryDto?>
        CreateProductInventoryAsync(
            int productId,
            CreateInventoryDto dto)
    {
        ValidateCreate(dto);

        var product =
            await _context.Products
                .FirstOrDefaultAsync(x =>
                    x.Id == productId &&
                    !x.IsDeleted);

        if (product is null)
            return null;


        // -----------------------------------------------------
        // Simple Product only
        // -----------------------------------------------------

        var hasVariants =
            await _context.ProductVariants
                .AnyAsync(x =>
                    x.ProductId == productId &&
                    !x.IsDeleted);

        if (hasVariants)
        {
            throw new ArgumentException(
                "This product has variants. Inventory must be managed per variant.");
        }


        var existingInventory =
            await _context.Inventories
                .FirstOrDefaultAsync(x =>
                    x.ProductId == productId &&
                    x.ProductVariantId == null &&
                    !x.IsDeleted);

        if (existingInventory is not null)
        {
            throw new ArgumentException(
                "Inventory already exists for this product.");
        }


        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            var inventory =
                new InventoryEntity
                {
                    ProductId =
                        productId,

                    ProductVariantId =
                        null,

                    StockQuantity =
                        dto.StockQuantity,

                    ReservedQuantity =
                        dto.ReservedQuantity,

                    ReorderLevel =
                        dto.ReorderLevel,

                    IsActive =
                        dto.IsActive,

                    CreatedAt =
                        DateTime.UtcNow,

                    IsDeleted =
                        false
                };

            _context.Inventories.Add(
                inventory);

            await _context.SaveChangesAsync();

            await CreateInitialTransactionIfNeeded(
                inventory,
                dto.StockQuantity);

            await transaction.CommitAsync();

            return MapToDto(inventory);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }


    public async Task<InventoryDto?>
        UpdateProductInventoryAsync(
            int productId,
            UpdateInventoryDto dto)
    {
        ValidateUpdate(dto);

        var inventory =
            await _context.Inventories
                .FirstOrDefaultAsync(x =>
                    x.ProductId == productId &&
                    x.ProductVariantId == null &&
                    !x.IsDeleted);

        if (inventory is null)
            return null;

        return await UpdateInventoryInternalAsync(
            inventory,
            dto);
    }


    public async Task<InventoryDto?>
        AdjustProductStockAsync(
            int productId,
            InventoryAdjustmentDto dto)
    {
        if (dto.Quantity == 0)
        {
            throw new ArgumentException(
                "Adjustment quantity cannot be zero.");
        }

        var inventory =
            await _context.Inventories
                .FirstOrDefaultAsync(x =>
                    x.ProductId == productId &&
                    x.ProductVariantId == null &&
                    !x.IsDeleted);

        if (inventory is null)
            return null;

        return await AdjustInventoryInternalAsync(
            inventory,
            dto);
    }


    public async Task<IEnumerable<InventoryTransactionDto>>
        GetProductTransactionsAsync(
            int productId)
    {
        var inventory =
            await _context.Inventories
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.ProductId == productId &&
                    x.ProductVariantId == null &&
                    !x.IsDeleted);

        if (inventory is null)
        {
            return Enumerable.Empty
                <InventoryTransactionDto>();
        }

        return await GetTransactionsByInventoryIdAsync(
            inventory.Id);
    }


    // =========================================================
    // RESERVE STOCK - VARIANT
    // =========================================================

    public async Task<InventoryDto?>
        ReserveStockAsync(
            int productVariantId,
            ReserveStockDto dto)
    {
        ValidateReservation(dto.Quantity);

        var inventory =
            await _context.Inventories
                .FirstOrDefaultAsync(x =>
                    x.ProductVariantId ==
                        productVariantId &&
                    !x.IsDeleted &&
                    x.IsActive);

        if (inventory is null)
            return null;

        return await ReserveInternalAsync(
            inventory,
            dto);
    }


    // =========================================================
    // RELEASE STOCK - VARIANT
    // =========================================================

    public async Task<InventoryDto?>
        ReleaseStockAsync(
            int productVariantId,
            ReleaseStockDto dto)
    {
        ValidateReservation(dto.Quantity);

        var inventory =
            await _context.Inventories
                .FirstOrDefaultAsync(x =>
                    x.ProductVariantId ==
                        productVariantId &&
                    !x.IsDeleted &&
                    x.IsActive);

        if (inventory is null)
            return null;

        return await ReleaseInternalAsync(
            inventory,
            dto);
    }


    // =========================================================
    // RESERVE STOCK IN TRANSACTION
    // =========================================================

    public async Task<InventoryDto?>
        ReserveStockInTransactionAsync(
            int productVariantId,
            ReserveStockDto dto)
    {
        ValidateReservation(dto.Quantity);

        var inventory =
            await _context.Inventories
                .FirstOrDefaultAsync(x =>
                    x.ProductVariantId ==
                        productVariantId &&
                    !x.IsDeleted &&
                    x.IsActive);

        if (inventory is null)
            return null;

        return await ReserveWithoutTransactionAsync(
            inventory,
            dto);
    }


    // =========================================================
    // RELEASE STOCK IN TRANSACTION
    // =========================================================

    public async Task<InventoryDto?>
        ReleaseStockInTransactionAsync(
            int productVariantId,
            ReleaseStockDto dto)
    {
        ValidateReservation(dto.Quantity);

        var inventory =
            await _context.Inventories
                .FirstOrDefaultAsync(x =>
                    x.ProductVariantId ==
                        productVariantId &&
                    !x.IsDeleted &&
                    x.IsActive);

        if (inventory is null)
            return null;

        return await ReleaseWithoutTransactionAsync(
            inventory,
            dto);
    }


    // =========================================================
    // INTERNAL - UPDATE
    // =========================================================

    private async Task<InventoryDto?>
        UpdateInventoryInternalAsync(
            InventoryEntity inventory,
            UpdateInventoryDto dto)
    {
        var oldStock =
            inventory.StockQuantity;

        var stockDifference =
            dto.StockQuantity -
            oldStock;

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            inventory.StockQuantity =
                dto.StockQuantity;

            inventory.ReservedQuantity =
                dto.ReservedQuantity;

            inventory.ReorderLevel =
                dto.ReorderLevel;

            inventory.IsActive =
                dto.IsActive;

            inventory.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            if (stockDifference != 0)
            {
                var inventoryTransaction =
                    new InventoryTransactionEntity
                    {
                        InventoryId =
                            inventory.Id,

                        Quantity =
                            stockDifference,

                        QuantityBefore =
                            oldStock,

                        QuantityAfter =
                            dto.StockQuantity,

                        TransactionType =
                            "Adjustment",

                        Note =
                            "Inventory manually updated.",

                        CreatedAt =
                            DateTime.UtcNow,

                        IsDeleted =
                            false
                    };

                _context.InventoryTransactions.Add(
                    inventoryTransaction);

                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();

            return MapToDto(inventory);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }


    // =========================================================
    // INTERNAL - ADJUST
    // =========================================================

    private async Task<InventoryDto?>
        AdjustInventoryInternalAsync(
            InventoryEntity inventory,
            InventoryAdjustmentDto dto)
    {
        var newStock =
            inventory.StockQuantity +
            dto.Quantity;

        if (newStock < 0)
        {
            throw new ArgumentException(
                "Insufficient stock.");
        }

        if (inventory.ReservedQuantity >
            newStock)
        {
            throw new ArgumentException(
                "Stock cannot be lower than reserved quantity.");
        }

        var stockBefore =
            inventory.StockQuantity;


        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            inventory.StockQuantity =
                newStock;

            inventory.UpdatedAt =
                DateTime.UtcNow;


            var inventoryTransaction =
                new InventoryTransactionEntity
                {
                    InventoryId =
                        inventory.Id,

                    Quantity =
                        dto.Quantity,

                    QuantityBefore =
                        stockBefore,

                    QuantityAfter =
                        newStock,

                    TransactionType =
                        dto.TransactionType.Trim(),

                    ReferenceType =
                        dto.ReferenceType?.Trim(),

                    ReferenceId =
                        dto.ReferenceId?.Trim(),

                    Note =
                        dto.Note?.Trim(),

                    CreatedAt =
                        DateTime.UtcNow,

                    IsDeleted =
                        false
                };

            _context.InventoryTransactions.Add(
                inventoryTransaction);

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return MapToDto(inventory);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }


    // =========================================================
    // INTERNAL - RESERVE
    // =========================================================

    private async Task<InventoryDto?>
        ReserveInternalAsync(
            InventoryEntity inventory,
            ReserveStockDto dto)
    {
        var availableQuantity =
            inventory.StockQuantity -
            inventory.ReservedQuantity;

        if (dto.Quantity >
            availableQuantity)
        {
            throw new ArgumentException(
                "Insufficient available stock.");
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            var reservedBefore =
                inventory.ReservedQuantity;

            inventory.ReservedQuantity +=
                dto.Quantity;

            inventory.UpdatedAt =
                DateTime.UtcNow;


            var inventoryTransaction =
                new InventoryTransactionEntity
                {
                    InventoryId =
                        inventory.Id,

                    Quantity =
                        dto.Quantity,

                    QuantityBefore =
                        availableQuantity,

                    QuantityAfter =
                        availableQuantity -
                        dto.Quantity,

                    TransactionType =
                        "Reservation",

                    ReferenceType =
                        dto.ReferenceType?.Trim(),

                    ReferenceId =
                        dto.ReferenceId?.Trim(),

                    Note =
                        dto.Note?.Trim(),

                    CreatedAt =
                        DateTime.UtcNow,

                    IsDeleted =
                        false
                };

            _context.InventoryTransactions.Add(
                inventoryTransaction);

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return MapToDto(inventory);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }


    // =========================================================
    // INTERNAL - RELEASE
    // =========================================================

    private async Task<InventoryDto?>
        ReleaseInternalAsync(
            InventoryEntity inventory,
            ReleaseStockDto dto)
    {
        if (dto.Quantity >
            inventory.ReservedQuantity)
        {
            throw new ArgumentException(
                "Release quantity cannot be greater than reserved quantity.");
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            var availableBefore =
                inventory.StockQuantity -
                inventory.ReservedQuantity;

            inventory.ReservedQuantity -=
                dto.Quantity;

            inventory.UpdatedAt =
                DateTime.UtcNow;

            var availableAfter =
                inventory.StockQuantity -
                inventory.ReservedQuantity;


            var inventoryTransaction =
                new InventoryTransactionEntity
                {
                    InventoryId =
                        inventory.Id,

                    Quantity =
                        dto.Quantity,

                    QuantityBefore =
                        availableBefore,

                    QuantityAfter =
                        availableAfter,

                    TransactionType =
                        "ReservationRelease",

                    ReferenceType =
                        dto.ReferenceType?.Trim(),

                    ReferenceId =
                        dto.ReferenceId?.Trim(),

                    Note =
                        dto.Note?.Trim(),

                    CreatedAt =
                        DateTime.UtcNow,

                    IsDeleted =
                        false
                };

            _context.InventoryTransactions.Add(
                inventoryTransaction);

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return MapToDto(inventory);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }


    // =========================================================
    // INTERNAL - RESERVE WITHOUT TRANSACTION
    // Used when caller already has transaction
    // =========================================================

    private async Task<InventoryDto?>
        ReserveWithoutTransactionAsync(
            InventoryEntity inventory,
            ReserveStockDto dto)
    {
        var availableQuantity =
            inventory.StockQuantity -
            inventory.ReservedQuantity;

        if (dto.Quantity >
            availableQuantity)
        {
            throw new ArgumentException(
                "Insufficient available stock.");
        }

        inventory.ReservedQuantity +=
            dto.Quantity;

        inventory.UpdatedAt =
            DateTime.UtcNow;

        var inventoryTransaction =
            new InventoryTransactionEntity
            {
                InventoryId =
                    inventory.Id,

                Quantity =
                    dto.Quantity,

                QuantityBefore =
                    availableQuantity,

                QuantityAfter =
                    availableQuantity -
                    dto.Quantity,

                TransactionType =
                    "Reservation",

                ReferenceType =
                    dto.ReferenceType?.Trim(),

                ReferenceId =
                    dto.ReferenceId?.Trim(),

                Note =
                    dto.Note?.Trim(),

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        _context.InventoryTransactions.Add(
            inventoryTransaction);

        await _context.SaveChangesAsync();

        return MapToDto(inventory);
    }


    // =========================================================
    // INTERNAL - RELEASE WITHOUT TRANSACTION
    // =========================================================

    private async Task<InventoryDto?>
        ReleaseWithoutTransactionAsync(
            InventoryEntity inventory,
            ReleaseStockDto dto)
    {
        if (dto.Quantity >
            inventory.ReservedQuantity)
        {
            throw new ArgumentException(
                "Release quantity cannot be greater than reserved quantity.");
        }

        var availableBefore =
            inventory.StockQuantity -
            inventory.ReservedQuantity;

        inventory.ReservedQuantity -=
            dto.Quantity;

        inventory.UpdatedAt =
            DateTime.UtcNow;

        var availableAfter =
            inventory.StockQuantity -
            inventory.ReservedQuantity;

        var inventoryTransaction =
            new InventoryTransactionEntity
            {
                InventoryId =
                    inventory.Id,

                Quantity =
                    dto.Quantity,

                QuantityBefore =
                    availableBefore,

                QuantityAfter =
                    availableAfter,

                TransactionType =
                    "ReservationRelease",

                ReferenceType =
                    dto.ReferenceType?.Trim(),

                ReferenceId =
                    dto.ReferenceId?.Trim(),

                Note =
                    dto.Note?.Trim(),

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        _context.InventoryTransactions.Add(
            inventoryTransaction);

        await _context.SaveChangesAsync();

        return MapToDto(inventory);
    }


    // =========================================================
    // INITIAL TRANSACTION
    // =========================================================

    private async Task
        CreateInitialTransactionIfNeeded(
            InventoryEntity inventory,
            int stockQuantity)
    {
        if (stockQuantity <= 0)
            return;

        var inventoryTransaction =
            new InventoryTransactionEntity
            {
                InventoryId =
                    inventory.Id,

                Quantity =
                    stockQuantity,

                QuantityBefore =
                    0,

                QuantityAfter =
                    stockQuantity,

                TransactionType =
                    "InitialStock",

                Note =
                    "Initial inventory created.",

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        _context.InventoryTransactions.Add(
            inventoryTransaction);

        await _context.SaveChangesAsync();
    }


    // =========================================================
    // TRANSACTIONS
    // =========================================================

    private async Task<
        IEnumerable<InventoryTransactionDto>>
        GetTransactionsByInventoryIdAsync(
            int inventoryId)
    {
        return await _context
            .InventoryTransactions
            .AsNoTracking()
            .Where(x =>
                x.InventoryId ==
                    inventoryId &&
                !x.IsDeleted)
            .OrderByDescending(
                x => x.CreatedAt)
            .Select(x =>
                new InventoryTransactionDto
                {
                    Id =
                        x.Id,

                    InventoryId =
                        x.InventoryId,

                    Quantity =
                        x.Quantity,

                    QuantityBefore =
                        x.QuantityBefore,

                    QuantityAfter =
                        x.QuantityAfter,

                    TransactionType =
                        x.TransactionType,

                    ReferenceType =
                        x.ReferenceType,

                    ReferenceId =
                        x.ReferenceId,

                    Note =
                        x.Note,

                    CreatedAt =
                        x.CreatedAt
                })
            .ToListAsync();
    }


    // =========================================================
    // VALIDATION
    // =========================================================

    private static void ValidateCreate(
        CreateInventoryDto dto)
    {
        if (dto.StockQuantity < 0)
        {
            throw new ArgumentException(
                "Stock quantity cannot be negative.");
        }

        if (dto.ReservedQuantity < 0)
        {
            throw new ArgumentException(
                "Reserved quantity cannot be negative.");
        }

        if (dto.ReservedQuantity >
            dto.StockQuantity)
        {
            throw new ArgumentException(
                "Reserved quantity cannot be greater than stock quantity.");
        }

        if (dto.ReorderLevel < 0)
        {
            throw new ArgumentException(
                "Reorder level cannot be negative.");
        }
    }


    private static void ValidateUpdate(
        UpdateInventoryDto dto)
    {
        if (dto.StockQuantity < 0)
        {
            throw new ArgumentException(
                "Stock quantity cannot be negative.");
        }

        if (dto.ReservedQuantity < 0)
        {
            throw new ArgumentException(
                "Reserved quantity cannot be negative.");
        }

        if (dto.ReservedQuantity >
            dto.StockQuantity)
        {
            throw new ArgumentException(
                "Reserved quantity cannot be greater than stock quantity.");
        }

        if (dto.ReorderLevel < 0)
        {
            throw new ArgumentException(
                "Reorder level cannot be negative.");
        }
    }


    private static void ValidateReservation(
        int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentException(
                "Quantity must be greater than zero.");
        }
    }


    // =========================================================
    // DTO MAPPER
    // =========================================================

    private static InventoryDto MapToDto(
        InventoryEntity inventory)
    {
        return new InventoryDto
        {
            Id =
                inventory.Id,

            ProductId =
                inventory.ProductId,

            ProductVariantId =
                inventory.ProductVariantId,

            StockQuantity =
                inventory.StockQuantity,

            ReservedQuantity =
                inventory.ReservedQuantity,

            AvailableQuantity =
                inventory.StockQuantity -
                inventory.ReservedQuantity,

            ReorderLevel =
                inventory.ReorderLevel,

            IsActive =
                inventory.IsActive
        };
    }
}