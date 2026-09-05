using Ecommerce.Application.DTOs.Menu;
using Ecommerce.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/menus")]
public class MenusController : ControllerBase
{
    private readonly IMenuService _menuService;

    public MenusController(
        IMenuService menuService)
    {
        _menuService = menuService;
    }


    // =========================================================
    // GET: api/menus
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var menus =
            await _menuService.GetAllAsync();

        return Ok(menus);
    }


    // =========================================================
    // GET: api/menus/header
    // =========================================================

    [HttpGet("header")]
    public async Task<IActionResult> GetHeaderMenu()
    {
        var menus =
            await _menuService
                .GetHeaderMenuAsync();

        return Ok(menus);
    }


    // =========================================================
    // GET: api/menus/{id}
    // =========================================================

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(
        int id)
    {
        var menu =
            await _menuService
                .GetByIdAsync(id);

        if (menu is null)
        {
            return NotFound();
        }

        return Ok(menu);
    }


    // =========================================================
    // POST: api/menus
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateMenuItemDto dto)
    {
        try
        {
            var menu =
                await _menuService
                    .CreateAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = menu.Id },
                menu);
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
    // PUT: api/menus/{id}
    // =========================================================

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        UpdateMenuItemDto dto)
    {
        try
        {
            var menu =
                await _menuService
                    .UpdateAsync(id, dto);

            if (menu is null)
            {
                return NotFound();
            }

            return Ok(menu);
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
    // DELETE: api/menus/{id}
    // =========================================================

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int id)
    {
        try
        {
            var deleted =
                await _menuService
                    .DeleteAsync(id);

            if (!deleted)
            {
                return NotFound();
            }

            return Ok(new
            {
                message =
                    "Menu item deleted successfully."
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