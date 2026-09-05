using Ecommerce.Application.DTOs.Customer;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services;

public class CustomerAuthService : ICustomerAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;

    public CustomerAuthService(
        ApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    // =========================================================
    // REGISTER
    // =========================================================

    public async Task<CustomerAuthResponseDto> RegisterAsync(
        RegisterCustomerDto dto)
    {
        if (dto is null)
        {
            throw new ArgumentException(
                "Registration data is required.");
        }

        var firstName =
            dto.FirstName.Trim();

        var lastName =
            dto.LastName?.Trim();

        var email =
            NormalizeEmail(dto.Email);

        var phone =
            NormalizePhone(dto.Phone);

        // -----------------------------------------------------
        // Email OR Phone required
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(email) &&
            string.IsNullOrWhiteSpace(phone))
        {
            throw new ArgumentException(
                "Email or phone number is required.");
        }

        // -----------------------------------------------------
        // Password validation
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(dto.Password))
        {
            throw new ArgumentException(
                "Password is required.");
        }

        if (dto.Password.Length < 6)
        {
            throw new ArgumentException(
                "Password must be at least 6 characters.");
        }

        // -----------------------------------------------------
        // Check duplicate Email
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(email))
        {
            var emailExists =
                await _context.Customers
                    .AnyAsync(x =>
                        x.Email == email &&
                        !x.IsDeleted);

            if (emailExists)
            {
                throw new ArgumentException(
                    "This email is already registered.");
            }
        }

        // -----------------------------------------------------
        // Check duplicate Phone
        // -----------------------------------------------------

        if (!string.IsNullOrWhiteSpace(phone))
        {
            var phoneExists =
                await _context.Customers
                    .AnyAsync(x =>
                        x.Phone == phone &&
                        !x.IsDeleted);

            if (phoneExists)
            {
                throw new ArgumentException(
                    "This phone number is already registered.");
            }
        }

        // -----------------------------------------------------
        // Create Customer
        // -----------------------------------------------------

        var customer =
            new Customer
            {
                FirstName =
                    firstName,

                LastName =
                    lastName,

                Email =
                    email,

                Phone =
                    phone,

                PasswordHash =
                    _passwordHasher.Hash(
                        dto.Password),

                IsEmailVerified =
                    false,

                IsPhoneVerified =
                    false,

                IsTwoFactorEnabled =
                    false,

                IsActive =
                    true,

                CreatedAt =
                    DateTime.UtcNow,

                IsDeleted =
                    false
            };

        _context.Customers.Add(
            customer);

        await _context.SaveChangesAsync();

        // -----------------------------------------------------
        // Generate JWT
        // -----------------------------------------------------

        var token =
            _jwtTokenService.GenerateToken(
                customer.Id,
                customer.Email,
                customer.Phone,
                customer.FirstName);

        return new CustomerAuthResponseDto
        {
            CustomerId =
                customer.Id,

            FirstName =
                customer.FirstName,

            LastName =
                customer.LastName,

            Email =
                customer.Email,

            Phone =
                customer.Phone,

            Token =
                token,

            IsTwoFactorRequired =
                false
        };
    }

    // =========================================================
    // LOGIN
    // =========================================================

    public async Task<CustomerAuthResponseDto> LoginAsync(
        LoginCustomerDto dto)
    {
        if (dto is null)
        {
            throw new ArgumentException(
                "Login data is required.");
        }

        var login =
            dto.Login.Trim();

        if (string.IsNullOrWhiteSpace(login))
        {
            throw new ArgumentException(
                "Email or phone number is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Password))
        {
            throw new ArgumentException(
                "Password is required.");
        }

        // -----------------------------------------------------
        // Normalize login
        // -----------------------------------------------------

        var normalizedEmail =
            NormalizeEmail(login);

        var normalizedPhone =
            NormalizePhone(login);

        // -----------------------------------------------------
        // Find Customer
        // -----------------------------------------------------

        var customer =
            await _context.Customers
                .FirstOrDefaultAsync(x =>
                    !x.IsDeleted &&
                    x.IsActive &&
                    (
                        (!string.IsNullOrWhiteSpace(x.Email) &&
                         x.Email == normalizedEmail)
                        ||
                        (!string.IsNullOrWhiteSpace(x.Phone) &&
                         x.Phone == normalizedPhone)
                    ));

        if (customer is null)
        {
            throw new ArgumentException(
                "Invalid email/phone or password.");
        }

        // -----------------------------------------------------
        // Password Check
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(
            customer.PasswordHash))
        {
            throw new ArgumentException(
                "This account does not have a password configured.");
        }

        var passwordValid =
            _passwordHasher.Verify(
                dto.Password,
                customer.PasswordHash);

        if (!passwordValid)
        {
            throw new ArgumentException(
                "Invalid email/phone or password.");
        }

        // -----------------------------------------------------
        // JWT
        // -----------------------------------------------------

        var token =
            _jwtTokenService.GenerateToken(
                customer.Id,
                customer.Email,
                customer.Phone,
                customer.FirstName);

        return new CustomerAuthResponseDto
        {
            CustomerId =
                customer.Id,

            FirstName =
                customer.FirstName,

            LastName =
                customer.LastName,

            Email =
                customer.Email,

            Phone =
                customer.Phone,

            Token =
                token,

            IsTwoFactorRequired =
                customer.IsTwoFactorEnabled
        };
    }

    // =========================================================
    // NORMALIZE EMAIL
    // =========================================================

    private static string? NormalizeEmail(
        string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        return email
            .Trim()
            .ToLowerInvariant();
    }

    // =========================================================
    // NORMALIZE PHONE
    // =========================================================

    private static string? NormalizePhone(
        string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return null;
        }

        var value =
            phone.Trim();

        // Remove common formatting characters
        value = value
            .Replace(" ", "")
            .Replace("-", "")
            .Replace("(", "")
            .Replace(")", "");

        // Bangladesh local format:
        // 017XXXXXXXX
        //
        // International:
        // +88017XXXXXXXX
        //
        // Store consistently as:
        // 017XXXXXXXX

        if (value.StartsWith("+880"))
        {
            value =
                "0" +
                value.Substring(4);
        }
        else if (value.StartsWith("880"))
        {
            value =
                "0" +
                value.Substring(3);
        }

        return value;
    }
}