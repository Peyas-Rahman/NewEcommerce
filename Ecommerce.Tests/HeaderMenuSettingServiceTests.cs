using Ecommerce.Application.DTOs.Menus;
using Ecommerce.Infrastructure.Data;
using Ecommerce.Infrastructure.Services.Menu;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Ecommerce.Tests;

public class HeaderMenuSettingServiceTests
{
    [Fact]
    public async Task GetAsync_WhenNoActiveSettingExists_ReturnsDefaultSettings()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new ApplicationDbContext(options);
        var service = new HeaderMenuSettingService(context);

        var result = await service.GetAsync();

        Assert.NotNull(result);
        Assert.Equal("Left", result!.Alignment);
        Assert.Equal("Normal", result.Spacing);
        Assert.True(result.ShowAllCategories);
        Assert.True(result.ShowDeals);
        Assert.True(result.IsSticky);
        Assert.True(result.IsActive);
    }

    [Fact]
    public async Task UpdateAsync_WhenNoActiveSettingExists_CreatesDefaultSetting()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new ApplicationDbContext(options);
        var service = new HeaderMenuSettingService(context);

        var result = await service.UpdateAsync(new UpdateHeaderMenuSettingDto
        {
            Alignment = "Center",
            Spacing = "Compact",
            ShowAllCategories = false,
            ShowDeals = false,
            IsSticky = false,
            IsActive = true
        });

        Assert.Equal("Center", result.Alignment);
        Assert.Equal("Compact", result.Spacing);
        Assert.False(result.ShowAllCategories);
        Assert.False(result.ShowDeals);
        Assert.False(result.IsSticky);
        Assert.True(result.IsActive);
        Assert.Equal(1, await context.HeaderMenuSettings.CountAsync());
    }
}
