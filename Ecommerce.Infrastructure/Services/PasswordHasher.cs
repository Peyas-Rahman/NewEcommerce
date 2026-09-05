using Ecommerce.Application.Interfaces.Services;
using System.Security.Cryptography;

namespace Ecommerce.Infrastructure.Services;

public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 100_000;

    public string Hash(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException(
                "Password is required.");
        }

        var salt = RandomNumberGenerator.GetBytes(
            SaltSize);

        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Iterations,
            HashAlgorithmName.SHA256,
            KeySize);

        return string.Join(
            ".",
            Iterations,
            Convert.ToBase64String(salt),
            Convert.ToBase64String(hash));
    }

    public bool Verify(
        string password,
        string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(password) ||
            string.IsNullOrWhiteSpace(passwordHash))
        {
            return false;
        }

        var parts =
            passwordHash.Split('.');

        if (parts.Length != 3)
        {
            return false;
        }

        if (!int.TryParse(
            parts[0],
            out var iterations))
        {
            return false;
        }

        try
        {
            var salt =
                Convert.FromBase64String(parts[1]);

            var storedHash =
                Convert.FromBase64String(parts[2]);

            var computedHash =
                Rfc2898DeriveBytes.Pbkdf2(
                    password,
                    salt,
                    iterations,
                    HashAlgorithmName.SHA256,
                    storedHash.Length);

            return CryptographicOperations.FixedTimeEquals(
                computedHash,
                storedHash);
        }
        catch
        {
            return false;
        }
    }
}