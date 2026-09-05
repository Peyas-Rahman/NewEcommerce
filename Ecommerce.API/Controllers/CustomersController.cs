using Ecommerce.Application.DTOs.Customer;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/customers")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerAuthService _customerAuthService;
    private readonly ApplicationDbContext _context;
    private readonly IOrderService _orderService;
    private readonly ICustomerAddressService _customerAddressService;
    private readonly ICustomerWishlistService _customerWishlistService;


    public CustomersController(
        ICustomerAuthService customerAuthService,
        ApplicationDbContext context,
        IOrderService orderService,
        ICustomerWishlistService customerWishlistService,
        ICustomerAddressService customerAddressService)
    {
        _customerWishlistService =
            customerWishlistService;

        _customerAuthService =
            customerAuthService;

        _context =
            context;

        _orderService =
            orderService;

        _customerAddressService =
            customerAddressService;
    }

    // =========================================================
    // REGISTER
    // =========================================================

    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterCustomerDto dto)
    {
        try
        {
            var result =
                await _customerAuthService.RegisterAsync(dto);

            return Ok(result);
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
    // LOGIN
    // =========================================================

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginCustomerDto dto)
    {
        try
        {
            var result =
                await _customerAuthService.LoginAsync(dto);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return Unauthorized(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // CURRENT CUSTOMER
    // =========================================================

    [Authorize]
    [HttpGet("me")]
    public IActionResult GetCurrentCustomer()
    {
        var customerId =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(customerId))
        {
            return Unauthorized(new
            {
                message =
                    "Customer identity not found."
            });
        }

        if (!int.TryParse(
            customerId,
            out var customerIdValue))
        {
            return Unauthorized(new
            {
                message =
                    "Invalid customer identity."
            });
        }

        return Ok(new
        {
            customerId =
                customerIdValue,

            email =
                User.FindFirstValue(
                    ClaimTypes.Email),

            phone =
                User.FindFirstValue(
                    "phone"),

            name =
                User.FindFirstValue(
                    ClaimTypes.Name)
        });
    }

    // =========================================================
    // GET CURRENT CUSTOMER PROFILE
    // =========================================================

    [Authorize]
    [HttpGet("me/profile")]
    public async Task<IActionResult> GetMyProfile()
    {
        var customerIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!int.TryParse(
            customerIdValue,
            out var customerId))
        {
            return Unauthorized(new
            {
                message =
                    "Customer identity not found."
            });
        }

        var customer =
            await _context.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Id == customerId &&
                    x.IsActive &&
                    !x.IsDeleted);

        if (customer is null)
        {
            return NotFound(new
            {
                message =
                    "Customer not found."
            });
        }

        return Ok(new
        {
            id =
                customer.Id,

            firstName =
                customer.FirstName,

            lastName =
                customer.LastName,

            email =
                customer.Email,

            phone =
                customer.Phone,

            isEmailVerified =
                customer.IsEmailVerified,

            isPhoneVerified =
                customer.IsPhoneVerified,

            isTwoFactorEnabled =
                customer.IsTwoFactorEnabled,

            isActive =
                customer.IsActive,

            createdAt =
                customer.CreatedAt
        });
    }

    // =========================================================
    // GET MY ORDERS
    // =========================================================

    [Authorize]
    [HttpGet("me/orders")]
    public async Task<IActionResult> GetMyOrders()
    {
        var customerIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!int.TryParse(
            customerIdValue,
            out var customerId))
        {
            return Unauthorized(new
            {
                message =
                    "Customer identity not found."
            });
        }

        var orders =
            await _orderService
                .GetCustomerOrdersAsync(
                    customerId);

        return Ok(orders);
    }

    // =========================================================
    // GET MY ORDER DETAILS
    // =========================================================

    [Authorize]
    [HttpGet("me/orders/{orderId:int}")]
    public async Task<IActionResult> GetMyOrderDetails(
        int orderId)
    {
        var customerIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!int.TryParse(
            customerIdValue,
            out var customerId))
        {
            return Unauthorized(new
            {
                message =
                    "Customer identity not found."
            });
        }

        var order =
            await _orderService
                .GetCustomerOrderByIdAsync(
                    customerId,
                    orderId);

        if (order is null)
        {
            return NotFound(new
            {
                message =
                    "Order not found."
            });
        }

        return Ok(order);
    }

    // =========================================================
    // GET MY ADDRESSES
    // =========================================================

    [Authorize]
    [HttpGet("me/addresses")]
    public async Task<IActionResult> GetMyAddresses()
    {
        var customerIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!int.TryParse(
            customerIdValue,
            out var customerId))
        {
            return Unauthorized(new
            {
                message =
                    "Customer identity not found."
            });
        }

        var addresses =
            await _customerAddressService
                .GetMyAddressesAsync(
                    customerId);

        return Ok(addresses);
    }

    // =========================================================
    // GET MY ADDRESS BY ID
    // =========================================================

    [Authorize]
    [HttpGet("me/addresses/{addressId:int}")]
    public async Task<IActionResult> GetMyAddress(
        int addressId)
    {
        var customerIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!int.TryParse(
            customerIdValue,
            out var customerId))
        {
            return Unauthorized(new
            {
                message =
                    "Customer identity not found."
            });
        }

        var address =
            await _customerAddressService
                .GetByIdAsync(
                    customerId,
                    addressId);

        if (address is null)
        {
            return NotFound(new
            {
                message =
                    "Address not found."
            });
        }

        return Ok(address);
    }

    // =========================================================
    // CREATE ADDRESS
    // =========================================================

    [Authorize]
    [HttpPost("me/addresses")]
    public async Task<IActionResult> CreateAddress(
        [FromBody] CreateCustomerAddressDto dto)
    {
        try
        {
            var customerIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (!int.TryParse(
                customerIdValue,
                out var customerId))
            {
                return Unauthorized(new
                {
                    message =
                        "Customer identity not found."
                });
            }

            var address =
                await _customerAddressService
                    .CreateAsync(
                        customerId,
                        dto);

            return Ok(address);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message =
                    ex.Message
            });
        }
    }

    // =========================================================
    // UPDATE ADDRESS
    // =========================================================

    [Authorize]
    [HttpPut("me/addresses/{addressId:int}")]
    public async Task<IActionResult> UpdateAddress(
        int addressId,
        [FromBody] UpdateCustomerAddressDto dto)
    {
        try
        {
            var customerIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (!int.TryParse(
                customerIdValue,
                out var customerId))
            {
                return Unauthorized(new
                {
                    message =
                        "Customer identity not found."
                });
            }

            var address =
                await _customerAddressService
                    .UpdateAsync(
                        customerId,
                        addressId,
                        dto);

            if (address is null)
            {
                return NotFound(new
                {
                    message =
                        "Address not found."
                });
            }

            return Ok(address);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message =
                    ex.Message
            });
        }
    }

    // =========================================================
    // DELETE ADDRESS
    // =========================================================

    [Authorize]
    [HttpDelete("me/addresses/{addressId:int}")]
    public async Task<IActionResult> DeleteAddress(
        int addressId)
    {
        try
        {
            var customerIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (!int.TryParse(
                customerIdValue,
                out var customerId))
            {
                return Unauthorized(new
                {
                    message =
                        "Customer identity not found."
                });
            }

            var deleted =
                await _customerAddressService
                    .DeleteAsync(
                        customerId,
                        addressId);

            if (!deleted)
            {
                return NotFound(new
                {
                    message =
                        "Address not found."
                });
            }

            return Ok(new
            {
                message =
                    "Address deleted successfully."
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message =
                    ex.Message
            });
        }
    }

    // =========================================================
    // GET MY WISHLIST
    // =========================================================

    [Authorize]
    [HttpGet("me/wishlist")]
    public async Task<IActionResult> GetMyWishlist()
    {
        var customerIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!int.TryParse(
            customerIdValue,
            out var customerId))
        {
            return Unauthorized(new
            {
                message =
                    "Customer identity not found."
            });
        }

        var wishlist =
            await _customerWishlistService
                .GetMyWishlistAsync(
                    customerId);

        return Ok(wishlist);
    }


    // =========================================================
    // ADD PRODUCT TO WISHLIST
    // =========================================================

    [Authorize]
    [HttpPost("me/wishlist/{productId:int}")]
    public async Task<IActionResult> AddToWishlist(
        int productId)
    {
        try
        {
            var customerIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (!int.TryParse(
                customerIdValue,
                out var customerId))
            {
                return Unauthorized(new
                {
                    message =
                        "Customer identity not found."
                });
            }

            var wishlist =
                await _customerWishlistService
                    .AddAsync(
                        customerId,
                        productId);

            if (wishlist is null)
            {
                return NotFound(new
                {
                    message =
                        "Product not found."
                });
            }

            return Ok(wishlist);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message =
                    ex.Message
            });
        }
    }


    // =========================================================
    // REMOVE PRODUCT FROM WISHLIST
    // =========================================================

    [Authorize]
    [HttpDelete("me/wishlist/{productId:int}")]
    public async Task<IActionResult> RemoveFromWishlist(
        int productId)
    {
        try
        {
            var customerIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (!int.TryParse(
                customerIdValue,
                out var customerId))
            {
                return Unauthorized(new
                {
                    message =
                        "Customer identity not found."
                });
            }

            var removed =
                await _customerWishlistService
                    .RemoveAsync(
                        customerId,
                        productId);

            if (!removed)
            {
                return NotFound(new
                {
                    message =
                        "Product is not in your wishlist."
                });
            }

            return Ok(new
            {
                message =
                    "Product removed from wishlist successfully."
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message =
                    ex.Message
            });
        }
    }

}