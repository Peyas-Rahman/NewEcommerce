using Ecommerce.Application.DTOs.Customer;
using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services.Customers;

public class CustomerAddressService
    : ICustomerAddressService
{
    private readonly ApplicationDbContext _context;

    public CustomerAddressService(
        ApplicationDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET MY ADDRESSES
    // =========================================================

    public async Task<IReadOnlyList<CustomerAddressDto>>
        GetMyAddressesAsync(
            int customerId)
    {
        if (customerId <= 0)
        {
            throw new ArgumentException(
                "Invalid customer ID.");
        }

        return await _context.CustomerAddresses
            .AsNoTracking()
            .Where(x =>
                x.CustomerId == customerId &&
                !x.IsDeleted)
            .OrderByDescending(x => x.IsDefault)
            .ThenByDescending(x => x.Id)
            .Select(x => new CustomerAddressDto
            {
                Id = x.Id,

                AddressType =
                    x.AddressType,

                FullName =
                    x.FullName,

                Phone =
                    x.Phone,

                AddressLine =
                    x.AddressLine,

                City =
                    x.City,

                Area =
                    x.Area,

                PostalCode =
                    x.PostalCode,

                IsDefault =
                    x.IsDefault
            })
            .ToListAsync();
    }

    // =========================================================
    // GET ADDRESS BY ID
    // =========================================================

    public async Task<CustomerAddressDto?>
        GetByIdAsync(
            int customerId,
            int addressId)
    {
        if (customerId <= 0)
        {
            throw new ArgumentException(
                "Invalid customer ID.");
        }

        if (addressId <= 0)
        {
            throw new ArgumentException(
                "Invalid address ID.");
        }

        return await _context.CustomerAddresses
            .AsNoTracking()
            .Where(x =>
                x.Id == addressId &&
                x.CustomerId == customerId &&
                !x.IsDeleted)
            .Select(x => new CustomerAddressDto
            {
                Id = x.Id,

                AddressType =
                    x.AddressType,

                FullName =
                    x.FullName,

                Phone =
                    x.Phone,

                AddressLine =
                    x.AddressLine,

                City =
                    x.City,

                Area =
                    x.Area,

                PostalCode =
                    x.PostalCode,

                IsDefault =
                    x.IsDefault
            })
            .FirstOrDefaultAsync();
    }

    // =========================================================
    // CREATE ADDRESS
    // =========================================================

    public async Task<CustomerAddressDto>
        CreateAsync(
            int customerId,
            CreateCustomerAddressDto dto)
    {
        if (customerId <= 0)
        {
            throw new ArgumentException(
                "Invalid customer ID.");
        }

        ValidateAddress(dto);

        var customerExists =
            await _context.Customers
                .AsNoTracking()
                .AnyAsync(x =>
                    x.Id == customerId &&
                    x.IsActive &&
                    !x.IsDeleted);

        if (!customerExists)
        {
            throw new ArgumentException(
                "Customer not found.");
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            // -------------------------------------------------
            // If this is default address,
            // remove default from existing addresses.
            // -------------------------------------------------

            if (dto.IsDefault)
            {
                await ClearDefaultAddressAsync(
                    customerId);
            }

            var address =
                new CustomerAddress
                {
                    CustomerId =
                        customerId,

                    AddressType =
                        dto.AddressType.Trim(),

                    FullName =
                        dto.FullName.Trim(),

                    Phone =
                        dto.Phone.Trim(),

                    AddressLine =
                        dto.AddressLine.Trim(),

                    City =
                        dto.City?.Trim(),

                    Area =
                        dto.Area?.Trim(),

                    PostalCode =
                        dto.PostalCode?.Trim(),

                    IsDefault =
                        dto.IsDefault,

                    CreatedAt =
                        DateTime.UtcNow,

                    IsDeleted =
                        false
                };

            _context.CustomerAddresses.Add(
                address);

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return MapToDto(address);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // =========================================================
    // UPDATE ADDRESS
    // =========================================================

    public async Task<CustomerAddressDto?>
        UpdateAsync(
            int customerId,
            int addressId,
            UpdateCustomerAddressDto dto)
    {
        if (customerId <= 0)
        {
            throw new ArgumentException(
                "Invalid customer ID.");
        }

        if (addressId <= 0)
        {
            throw new ArgumentException(
                "Invalid address ID.");
        }

        ValidateAddress(dto);

        var address =
            await _context.CustomerAddresses
                .FirstOrDefaultAsync(x =>
                    x.Id == addressId &&
                    x.CustomerId == customerId &&
                    !x.IsDeleted);

        if (address is null)
        {
            return null;
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            if (dto.IsDefault)
            {
                await ClearDefaultAddressAsync(
                    customerId,
                    addressId);
            }

            address.AddressType =
                dto.AddressType.Trim();

            address.FullName =
                dto.FullName.Trim();

            address.Phone =
                dto.Phone.Trim();

            address.AddressLine =
                dto.AddressLine.Trim();

            address.City =
                dto.City?.Trim();

            address.Area =
                dto.Area?.Trim();

            address.PostalCode =
                dto.PostalCode?.Trim();

            address.IsDefault =
                dto.IsDefault;

            address.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return MapToDto(address);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // =========================================================
    // DELETE ADDRESS
    // =========================================================

    public async Task<bool>
        DeleteAsync(
            int customerId,
            int addressId)
    {
        if (customerId <= 0)
        {
            throw new ArgumentException(
                "Invalid customer ID.");
        }

        if (addressId <= 0)
        {
            throw new ArgumentException(
                "Invalid address ID.");
        }

        var address =
            await _context.CustomerAddresses
                .FirstOrDefaultAsync(x =>
                    x.Id == addressId &&
                    x.CustomerId == customerId &&
                    !x.IsDeleted);

        if (address is null)
        {
            return false;
        }

        address.IsDeleted =
            true;

        address.IsDefault =
            false;

        address.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    // =========================================================
    // CLEAR DEFAULT ADDRESS
    // =========================================================

    private async Task ClearDefaultAddressAsync(
        int customerId,
        int? exceptAddressId = null)
    {
        var addresses =
            await _context.CustomerAddresses
                .Where(x =>
                    x.CustomerId == customerId &&
                    x.IsDefault &&
                    !x.IsDeleted &&
                    (!exceptAddressId.HasValue ||
                     x.Id != exceptAddressId.Value))
                .ToListAsync();

        foreach (var address in addresses)
        {
            address.IsDefault =
                false;

            address.UpdatedAt =
                DateTime.UtcNow;
        }
    }

    // =========================================================
    // VALIDATE ADDRESS
    // =========================================================

    private static void ValidateAddress(
        CreateCustomerAddressDto dto)
    {
        if (string.IsNullOrWhiteSpace(
            dto.AddressType))
        {
            throw new ArgumentException(
                "Address type is required.");
        }

        if (string.IsNullOrWhiteSpace(
            dto.FullName))
        {
            throw new ArgumentException(
                "Full name is required.");
        }

        if (string.IsNullOrWhiteSpace(
            dto.Phone))
        {
            throw new ArgumentException(
                "Phone is required.");
        }

        if (string.IsNullOrWhiteSpace(
            dto.AddressLine))
        {
            throw new ArgumentException(
                "Address is required.");
        }
    }

    private static void ValidateAddress(
        UpdateCustomerAddressDto dto)
    {
        if (string.IsNullOrWhiteSpace(
            dto.AddressType))
        {
            throw new ArgumentException(
                "Address type is required.");
        }

        if (string.IsNullOrWhiteSpace(
            dto.FullName))
        {
            throw new ArgumentException(
                "Full name is required.");
        }

        if (string.IsNullOrWhiteSpace(
            dto.Phone))
        {
            throw new ArgumentException(
                "Phone is required.");
        }

        if (string.IsNullOrWhiteSpace(
            dto.AddressLine))
        {
            throw new ArgumentException(
                "Address is required.");
        }
    }

    // =========================================================
    // MAP TO DTO
    // =========================================================

    private static CustomerAddressDto MapToDto(
        CustomerAddress address)
    {
        return new CustomerAddressDto
        {
            Id =
                address.Id,

            AddressType =
                address.AddressType,

            FullName =
                address.FullName,

            Phone =
                address.Phone,

            AddressLine =
                address.AddressLine,

            City =
                address.City,

            Area =
                address.Area,

            PostalCode =
                address.PostalCode,

            IsDefault =
                address.IsDefault
        };
    }
}