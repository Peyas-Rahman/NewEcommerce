using Ecommerce.Application.DTOs.Payment;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(
        IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    // =========================================================
    // GET PAYMENT BY ID
    // =========================================================

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(
        int id)
    {
        var payment =
            await _paymentService.GetByIdAsync(id);

        if (payment is null)
        {
            return NotFound(new
            {
                message = "Payment not found."
            });
        }

        return Ok(payment);
    }

    // =========================================================
    // GET PAYMENT BY ORDER ID
    // =========================================================

    [HttpGet("order/{orderId:int}")]
    public async Task<IActionResult> GetByOrderId(
        int orderId)
    {
        var payment =
            await _paymentService
                .GetByOrderIdAsync(orderId);

        if (payment is null)
        {
            return NotFound(new
            {
                message =
                    "Payment not found for this order."
            });
        }

        return Ok(payment);
    }

    // =========================================================
    // CREATE PAYMENT
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreatePaymentDto dto)
    {
        try
        {
            var payment =
                await _paymentService
                    .CreateAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new
                {
                    id = payment.Id
                },
                payment);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // UPDATE PAYMENT STATUS
    // =========================================================

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] UpdatePaymentStatusDto dto)
    {
        try
        {
            var payment =
                await _paymentService
                    .UpdateStatusAsync(
                        id,
                        dto);

            if (payment is null)
            {
                return NotFound(new
                {
                    message =
                        "Payment not found."
                });
            }

            return Ok(payment);
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