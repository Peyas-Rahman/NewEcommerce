using Ecommerce.Application.DTOs.Menus;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/menus/header/settings")]
public class HeaderMenuSettingsController : ControllerBase
{
    private readonly IHeaderMenuSettingService _service;

    public HeaderMenuSettingsController(
        IHeaderMenuSettingService service)
    {
        _service = service;
    }


    // =========================================================
    // GET
    // GET: api/menus/header/settings
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var setting = await _service.GetAsync();

        if (setting is null)
        {
            return NotFound(new
            {
                message = "Header menu settings not found."
            });
        }

        return Ok(setting);
    }


    // =========================================================
    // PUT
    // PUT: api/menus/header/settings
    // =========================================================

    [HttpPut]
    public async Task<IActionResult> Update(
        UpdateHeaderMenuSettingDto dto)
    {
        try
        {
            var setting =
                await _service.UpdateAsync(dto);

            return Ok(setting);
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