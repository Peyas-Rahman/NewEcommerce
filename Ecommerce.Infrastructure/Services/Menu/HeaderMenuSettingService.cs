using Ecommerce.Application.DTOs.Menus;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.Menu;

public class HeaderMenuSettingService : IHeaderMenuSettingService
{
    private readonly ApplicationDbContext _context;

    public HeaderMenuSettingService(
        ApplicationDbContext context)
    {
        _context = context;
    }


    // =========================================================
    // GET HEADER MENU SETTINGS
    // =========================================================

    public async Task<HeaderMenuSettingDto?> GetAsync()
    {
        var setting = await _context.HeaderMenuSettings
            .FirstOrDefaultAsync(x => x.IsActive);

        if (setting == null)
        {
            setting = new HeaderMenuSetting
            {
                Alignment = "Left",
                Spacing = "Normal",
                ShowAllCategories = true,
                ShowDeals = true,
                IsSticky = true,
                IsActive = true
            };

            _context.HeaderMenuSettings.Add(setting);
            await _context.SaveChangesAsync();
        }

        return MapToDto(setting);
    }


    // =========================================================
    // UPDATE HEADER MENU SETTINGS
    // =========================================================

    public async Task<HeaderMenuSettingDto> UpdateAsync(
        UpdateHeaderMenuSettingDto dto)
    {
        // -----------------------------------------------------
        // Validate Alignment
        // -----------------------------------------------------

        var validAlignments = new[]
        {
            "Left",
            "Center",
            "Right"
        };

        if (!validAlignments.Contains(
                dto.Alignment,
                StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Alignment must be Left, Center, or Right.");
        }


        // -----------------------------------------------------
        // Validate Spacing
        // -----------------------------------------------------

        var validSpacings = new[]
        {
            "Compact",
            "Normal",
            "Spacious"
        };

        if (!validSpacings.Contains(
                dto.Spacing,
                StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "Spacing must be Compact, Normal, or Spacious.");
        }


        // -----------------------------------------------------
        // Find Existing Setting
        // -----------------------------------------------------

        var setting = await _context.HeaderMenuSettings
            .FirstOrDefaultAsync(x => x.IsActive);


        // -----------------------------------------------------
        // Create Default Setting If Not Exists
        // -----------------------------------------------------

        if (setting == null)
        {
            setting = new HeaderMenuSetting
            {
                Alignment = NormalizeAlignment(
                    dto.Alignment),

                Spacing = NormalizeSpacing(
                    dto.Spacing),

                ShowAllCategories =
                    dto.ShowAllCategories,

                ShowDeals =
                    dto.ShowDeals,

                IsSticky =
                    dto.IsSticky,

                IsActive = true
            };

            _context.HeaderMenuSettings.Add(setting);
        }
        else
        {
            // -------------------------------------------------
            // Update Existing Setting
            // -------------------------------------------------

            setting.Alignment =
                NormalizeAlignment(dto.Alignment);

            setting.Spacing =
                NormalizeSpacing(dto.Spacing);

            setting.ShowAllCategories =
                dto.ShowAllCategories;

            setting.ShowDeals =
                dto.ShowDeals;

            setting.IsSticky =
                dto.IsSticky;
        }


        await _context.SaveChangesAsync();

        return MapToDto(setting);
    }


    // =========================================================
    // MAP ENTITY → DTO
    // =========================================================

    private static HeaderMenuSettingDto MapToDto(
        HeaderMenuSetting entity)
    {
        return new HeaderMenuSettingDto
        {
            Id = entity.Id,

            Alignment =
                entity.Alignment,

            Spacing =
                entity.Spacing,

            ShowAllCategories =
                entity.ShowAllCategories,

            ShowDeals =
                entity.ShowDeals,

            IsSticky =
                entity.IsSticky,

            IsActive =
                entity.IsActive
        };
    }


    // =========================================================
    // NORMALIZE ALIGNMENT
    // =========================================================

    private static string NormalizeAlignment(
        string value)
    {
        return value.Trim().ToLowerInvariant() switch
        {
            "left" => "Left",
            "center" => "Center",
            "right" => "Right",

            _ => "Left"
        };
    }


    // =========================================================
    // NORMALIZE SPACING
    // =========================================================

    private static string NormalizeSpacing(
        string value)
    {
        return value.Trim().ToLowerInvariant() switch
        {
            "compact" => "Compact",
            "normal" => "Normal",
            "spacious" => "Spacious",

            _ => "Normal"
        };
    }
}