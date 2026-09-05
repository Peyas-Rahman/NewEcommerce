using Ecommerce.Application.DTOs.Order;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(
        IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateOrderDto dto)
    {
        try
        {
            var order =
                await _orderService.CreateAsync(dto);

            if (order is null)
                return BadRequest();

            return CreatedAtAction(
                nameof(GetById),
                new { id = order.Id },
                order);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(
        int id)
    {
        var order =
            await _orderService.GetByIdAsync(id);

        if (order is null)
            return NotFound();

        return Ok(order);
    }

    [HttpGet("number/{orderNumber}")]
    public async Task<IActionResult> GetByOrderNumber(
        string orderNumber)
    {
        var order =
            await _orderService
                .GetByOrderNumberAsync(orderNumber);

        if (order is null)
            return NotFound();

        return Ok(order);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var orders =
            await _orderService.GetAllAsync();

        return Ok(orders);
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        string status,
        string? note = null)
    {
        try
        {
            var updated =
                await _orderService.UpdateStatusAsync(
                    id,
                    status,
                    note);

            if (!updated)
                return NotFound();

            return Ok(new
            {
                message = "Order status updated successfully."
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(
        int id,
        string? note = null)
    {
        try
        {
            var cancelled =
                await _orderService.CancelAsync(
                    id,
                    note);

            if (!cancelled)
                return NotFound();

            return Ok(new
            {
                message = "Order cancelled successfully."
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }
}