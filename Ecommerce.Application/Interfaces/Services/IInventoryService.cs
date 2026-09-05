using Ecommerce.Application.DTOs.Inventory;

namespace Ecommerce.Application.Interfaces.Services;

public interface IInventoryService
{
    // =====================================================
    // VARIANT INVENTORY
    // =====================================================

    Task<InventoryDto?> GetByVariantIdAsync(
        int productVariantId);

    Task<InventoryDto?> CreateAsync(
        int productVariantId,
        CreateInventoryDto dto);

    Task<InventoryDto?> UpdateAsync(
        int productVariantId,
        UpdateInventoryDto dto);

    Task<InventoryDto?> AdjustStockAsync(
        int productVariantId,
        InventoryAdjustmentDto dto);

    Task<IEnumerable<InventoryTransactionDto>>
        GetTransactionsAsync(
            int productVariantId);


    // =====================================================
    // PRODUCT / SIMPLE PRODUCT INVENTORY
    // =====================================================

    Task<InventoryDto?> GetByProductIdAsync(
        int productId);

    Task<InventoryDto?> CreateProductInventoryAsync(
        int productId,
        CreateInventoryDto dto);

    Task<InventoryDto?> UpdateProductInventoryAsync(
        int productId,
        UpdateInventoryDto dto);

    Task<InventoryDto?> AdjustProductStockAsync(
        int productId,
        InventoryAdjustmentDto dto);

    Task<IEnumerable<InventoryTransactionDto>>
        GetProductTransactionsAsync(
            int productId);


    // =====================================================
    // RESERVATION
    // =====================================================

    Task<InventoryDto?> ReserveStockAsync(
        int productVariantId,
        ReserveStockDto dto);

    Task<InventoryDto?> ReleaseStockAsync(
        int productVariantId,
        ReleaseStockDto dto);

    Task<InventoryDto?> ReserveStockInTransactionAsync(
        int productVariantId,
        ReserveStockDto dto);

    Task<InventoryDto?> ReleaseStockInTransactionAsync(
        int productVariantId,
        ReleaseStockDto dto);
}