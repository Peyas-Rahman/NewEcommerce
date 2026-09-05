using Ecommerce.Application.DTOs.Inventory;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/products/{productId:int}/variants/{variantId:int}/inventory")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(
        IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }


    // =========================================================
    // VARIANT INVENTORY
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> Get(
        int productId,
        int variantId)
    {
        var inventory =
            await _inventoryService.GetByVariantIdAsync(
                variantId);

        if (inventory is null)
            return NotFound();

        return Ok(inventory);
    }


    [HttpPost]
    public async Task<IActionResult> Create(
        int productId,
        int variantId,
        CreateInventoryDto dto)
    {
        try
        {
            var inventory =
                await _inventoryService.CreateAsync(
                    variantId,
                    dto);

            if (inventory is null)
            {
                return NotFound(new
                {
                    message =
                        "Product variant not found."
                });
            }

            return Ok(inventory);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }


    [HttpPut]
    public async Task<IActionResult> Update(
        int productId,
        int variantId,
        UpdateInventoryDto dto)
    {
        try
        {
            var inventory =
                await _inventoryService.UpdateAsync(
                    variantId,
                    dto);

            if (inventory is null)
                return NotFound();

            return Ok(inventory);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }


    [HttpPost("adjust")]
    public async Task<IActionResult> AdjustStock(
        int productId,
        int variantId,
        InventoryAdjustmentDto dto)
    {
        try
        {
            var inventory =
                await _inventoryService.AdjustStockAsync(
                    variantId,
                    dto);

            if (inventory is null)
                return NotFound();

            return Ok(inventory);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }


    [HttpPost("reserve")]
    public async Task<IActionResult> ReserveStock(
        int productId,
        int variantId,
        ReserveStockDto dto)
    {
        try
        {
            var inventory =
                await _inventoryService.ReserveStockAsync(
                    variantId,
                    dto);

            if (inventory is null)
                return NotFound();

            return Ok(inventory);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }


    [HttpPost("release")]
    public async Task<IActionResult> ReleaseStock(
        int productId,
        int variantId,
        ReleaseStockDto dto)
    {
        try
        {
            var inventory =
                await _inventoryService.ReleaseStockAsync(
                    variantId,
                    dto);

            if (inventory is null)
                return NotFound();

            return Ok(inventory);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }


    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions(
        int productId,
        int variantId)
    {
        var transactions =
            await _inventoryService.GetTransactionsAsync(
                variantId);

        return Ok(transactions);
    }


    // =========================================================
    // SIMPLE PRODUCT INVENTORY
    // =========================================================

    [HttpGet("/api/inventory/product/{productId:int}")]
    public async Task<IActionResult> GetProductInventory(
        int productId)
    {
        var inventory =
            await _inventoryService.GetByProductIdAsync(
                productId);

        if (inventory is null)
            return NotFound();

        return Ok(inventory);
    }


    [HttpPost("/api/inventory/product/{productId:int}")]
    public async Task<IActionResult> CreateProductInventory(
        int productId,
        CreateInventoryDto dto)
    {
        try
        {
            var inventory =
                await _inventoryService
                    .CreateProductInventoryAsync(
                        productId,
                        dto);

            if (inventory is null)
            {
                return NotFound(new
                {
                    message =
                        "Product not found."
                });
            }

            return Ok(inventory);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }


    [HttpPut("/api/inventory/product/{productId:int}")]
    public async Task<IActionResult> UpdateProductInventory(
        int productId,
        UpdateInventoryDto dto)
    {
        try
        {
            var inventory =
                await _inventoryService
                    .UpdateProductInventoryAsync(
                        productId,
                        dto);

            if (inventory is null)
                return NotFound();

            return Ok(inventory);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }


    [HttpPost(
        "/api/inventory/product/{productId:int}/adjust")]
    public async Task<IActionResult> AdjustProductStock(
        int productId,
        InventoryAdjustmentDto dto)
    {
        try
        {
            var inventory =
                await _inventoryService
                    .AdjustProductStockAsync(
                        productId,
                        dto);

            if (inventory is null)
            {
                return NotFound(new
                {
                    message =
                        "Product inventory not found."
                });
            }

            return Ok(inventory);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }


    [HttpGet(
        "/api/inventory/product/{productId:int}/transactions")]
    public async Task<IActionResult>
        GetProductTransactions(
            int productId)
    {
        var transactions =
            await _inventoryService
                .GetProductTransactionsAsync(
                    productId);

        return Ok(transactions);
    }
}