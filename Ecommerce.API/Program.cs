using Ecommerce.Application.Interfaces.Services;
using Ecommerce.Infrastructure.Data;
using Ecommerce.Infrastructure.Services;
using Ecommerce.Infrastructure.Services.Brands;
using Ecommerce.Infrastructure.Services.Carts;
using Ecommerce.Infrastructure.Services.Categories;
using Ecommerce.Infrastructure.Services.Checkout;
using Ecommerce.Infrastructure.Services.Customers;
using Ecommerce.Infrastructure.Services.Inventory;
using Ecommerce.Infrastructure.Services.Menu;
using Ecommerce.Infrastructure.Services.HomepageSliders;
using Ecommerce.Infrastructure.Services.Order;
using Ecommerce.Infrastructure.Services.Payment;
using Ecommerce.Infrastructure.Services.ProductImages;
using Ecommerce.Infrastructure.Services.Products;
using Ecommerce.Infrastructure.Services.ProductVariants;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =====================================================
// Services
// =====================================================

builder.Services.AddControllers();

// =====================================================
// CORS
// =====================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// =====================================================
// OpenAPI
// =====================================================

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer(
        (document, context, cancellationToken) =>
        {
            // =================================================
            // JWT Bearer Security Scheme
            // =================================================

            var securityScheme =
                new Microsoft.OpenApi.OpenApiSecurityScheme
                {
                    Type =
                        Microsoft.OpenApi.SecuritySchemeType.Http,

                    Scheme =
                        "bearer",

                    In =
                        Microsoft.OpenApi.ParameterLocation.Header,

                    BearerFormat =
                        "JWT",

                    Description =
                        "Enter your JWT Bearer token."
                };

            document.Components ??=
                new Microsoft.OpenApi.OpenApiComponents();

            document.Components.SecuritySchemes =
                new Dictionary<
                    string,
                    Microsoft.OpenApi.IOpenApiSecurityScheme>
                {
                    ["Bearer"] =
                        securityScheme
                };

            // =================================================
            // Apply Bearer Security
            // =================================================

            foreach (
                var path in document.Paths.Values)
            {
                if (path?.Operations is null)
                {
                    continue;
                }

                foreach (
                    var operation in path.Operations.Values)
                {
                    if (operation is null)
                    {
                        continue;
                    }

                    operation.Security ??=
                        new List<
                            Microsoft.OpenApi.OpenApiSecurityRequirement>();

                    operation.Security.Add(
                        new Microsoft.OpenApi.OpenApiSecurityRequirement
                        {
                            [
                                new Microsoft.OpenApi.OpenApiSecuritySchemeReference(
                                    "Bearer",
                                    document)
                            ] = []
                        });
                }
            }

            return Task.CompletedTask;
        });
});

// =====================================================
// Database
// =====================================================

builder.Services.AddDbContext<ApplicationDbContext>(
    options =>
        options.UseSqlServer(
            builder.Configuration
                .GetConnectionString(
                    "DefaultConnection")));

// =====================================================
// Application Services
// =====================================================

builder.Services.AddScoped<
    ICategoryService,
    CategoryService>();

builder.Services.AddScoped<
    IBrandService,
    BrandService>();

builder.Services.AddScoped<
    IProductService,
    ProductService>();

builder.Services.AddScoped<
    IProductImageService,
    ProductImageService>();

builder.Services.AddScoped<
    IProductVariantService,
    ProductVariantService>();

builder.Services.AddScoped<
    IInventoryService,
    InventoryService>();

builder.Services.AddScoped<
    IOrderService,
    OrderService>();

builder.Services.AddScoped<
    ICartService,
    CartService>();

builder.Services.AddScoped<
    ICheckoutService,
    CheckoutService>();

builder.Services.AddScoped<
    IPasswordHasher,
    PasswordHasher>();

builder.Services.AddScoped<
    IJwtTokenService,
    JwtTokenService>();

builder.Services.AddScoped<
    ICustomerAuthService,
    CustomerAuthService>();

builder.Services.AddScoped<
    ICustomerAddressService,
    CustomerAddressService>();

builder.Services.AddScoped<
    ICustomerWishlistService,
    CustomerWishlistService>();

builder.Services.AddScoped<
    IPaymentService,
    PaymentService>();

builder.Services.AddScoped<IMenuService, MenuService>();

builder.Services.AddScoped<
    IHeaderMenuSettingService,
    HeaderMenuSettingService>();

builder.Services.AddScoped<IHomepageSliderService, HomepageSliderService>();

// =====================================================
// Authentication - JWT
// =====================================================

builder.Services.AddAuthentication(
    JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtKey =
            builder.Configuration["Jwt:Key"];

        var jwtIssuer =
            builder.Configuration["Jwt:Issuer"];

        var jwtAudience =
            builder.Configuration["Jwt:Audience"];

        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException(
                "JWT Key is not configured.");
        }

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,

                ValidateAudience = true,

                ValidateLifetime = true,

                ValidateIssuerSigningKey = true,

                ValidIssuer =
                    jwtIssuer,

                ValidAudience =
                    jwtAudience,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            jwtKey))
            };
    });

// =====================================================
// Authorization
// =====================================================

builder.Services.AddAuthorization();

// =====================================================
// Build Application
// =====================================================

var app = builder.Build();

// =====================================================
// Development / OpenAPI
// =====================================================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/openapi/v1.json",
            "Ecommerce API v1");
    });
}

// =====================================================
// Middleware Pipeline
// =====================================================

app.UseHttpsRedirection();
app.UseStaticFiles();


// IMPORTANT:
// Allow React frontend to call ASP.NET Core API
app.UseCors("Frontend");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();



// =====================================================
// Run
// =====================================================

app.Run();