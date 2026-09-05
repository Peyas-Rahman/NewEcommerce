using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductLevelInventorySupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // =========================================================
            // 1. Remove old unique index temporarily
            // =========================================================

            migrationBuilder.DropIndex(
                name: "IX_Inventories_ProductVariantId",
                table: "Inventories");


            // =========================================================
            // 2. ProductVariantId becomes nullable
            //    NULL = Product-level inventory
            // =========================================================

            migrationBuilder.AlterColumn<int>(
                name: "ProductVariantId",
                table: "Inventories",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");


            // =========================================================
            // 3. Add ProductId temporarily as nullable
            // =========================================================

            migrationBuilder.AddColumn<int>(
                name: "ProductId",
                table: "Inventories",
                type: "int",
                nullable: true);


            // =========================================================
            // 4. Existing Variant Inventory
            //
            // Copy ProductId from ProductVariants
            // =========================================================

            migrationBuilder.Sql(@"
        UPDATE i
        SET i.ProductId = pv.ProductId
        FROM Inventories i
        INNER JOIN ProductVariants pv
            ON i.ProductVariantId = pv.Id
        WHERE i.ProductVariantId IS NOT NULL;
    ");


            // =========================================================
            // 5. Safety check
            //
            // Existing inventory must have a valid ProductId
            // =========================================================

            migrationBuilder.Sql(@"
        IF EXISTS
        (
            SELECT 1
            FROM Inventories
            WHERE ProductId IS NULL
        )
        BEGIN
            THROW 50001,
                'Migration failed: Existing inventory contains rows that could not be mapped to a Product.',
                1;
        END;
    ");


            // =========================================================
            // 6. ProductId is now required
            // =========================================================

            migrationBuilder.AlterColumn<int>(
                name: "ProductId",
                table: "Inventories",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);


            // =========================================================
            // 7. Product + Variant index
            // =========================================================

            migrationBuilder.CreateIndex(
                name: "IX_Inventories_ProductId_ProductVariantId",
                table: "Inventories",
                columns: new[]
                {
            "ProductId",
            "ProductVariantId"
                });


            // =========================================================
            // 8. Variant inventory must remain unique
            //
            // Multiple NULL values are allowed.
            // =========================================================

            migrationBuilder.CreateIndex(
                name: "IX_Inventories_ProductVariantId",
                table: "Inventories",
                column: "ProductVariantId",
                unique: true,
                filter: "[ProductVariantId] IS NOT NULL");


            // =========================================================
            // 9. Product FK
            // =========================================================

            migrationBuilder.AddForeignKey(
                name: "FK_Inventories_Products_ProductId",
                table: "Inventories",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
        /// <inheritdoc />

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove Product FK
            migrationBuilder.DropForeignKey(
                name: "FK_Inventories_Products_ProductId",
                table: "Inventories");


            // Remove indexes
            migrationBuilder.DropIndex(
                name: "IX_Inventories_ProductId_ProductVariantId",
                table: "Inventories");

            migrationBuilder.DropIndex(
                name: "IX_Inventories_ProductVariantId",
                table: "Inventories");


            // Remove ProductId
            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "Inventories");


            // ProductVariantId becomes required again
            migrationBuilder.AlterColumn<int>(
                name: "ProductVariantId",
                table: "Inventories",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);


            // Restore original unique index
            migrationBuilder.CreateIndex(
                name: "IX_Inventories_ProductVariantId",
                table: "Inventories",
                column: "ProductVariantId",
                unique: true);
        }
    }
}
