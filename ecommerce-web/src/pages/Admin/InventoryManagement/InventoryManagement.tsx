import {
  AlertTriangle,
  Boxes,
  ChevronDown,
  ChevronRight,
  History,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import inventoryService, {
  type Inventory,
  type InventoryTransaction,
} from "../../../services/inventoryService";

const API =
  import.meta.env.VITE_API_BASE_URL || "/api";

interface Product {
  id: number;
  name: string;
  sku?: string | null;
  trackInventory?: boolean;
}

interface Variant {
  id: number;
  name: string;
  sku?: string | null;
  trackInventory?: boolean;
}

interface Row {
  productId: number;
  productName: string;
  productSku: string;

  /*
   * null = Simple Product
   */
  variantId: number | null;

  variantName: string;
  variantSku: string;

  inventory: Inventory | null;
}

type Filter =
  | "all"
  | "inStock"
  | "low"
  | "out";

type Modal =
  | "adjust"
  | "edit"
  | "history"
  | null;


// =========================================================
// Generic Array API helper
// =========================================================

async function arr<T>(
  url: string
): Promise<T[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status}`
    );
  }

  const data =
    await response.json();

  if (Array.isArray(data))
    return data;

  if (Array.isArray(data?.items))
    return data.items;

  if (Array.isArray(data?.data))
    return data.data;

  if (Array.isArray(data?.products))
    return data.products;

  if (Array.isArray(data?.variants))
    return data.variants;

  return [];
}


// =========================================================
// Inventory status
// =========================================================

function status(
  inventory: Inventory | null
) {
  if (!inventory)
    return "Not Configured";

  if (
    inventory.availableQuantity <= 0
  ) {
    return "Out of Stock";
  }

  if (
    inventory.availableQuantity <=
    inventory.reorderLevel
  ) {
    return "Low Stock";
  }

  return inventory.isActive
    ? "In Stock"
    : "Inactive";
}


// =========================================================
// Product level inventory loader
//
// IMPORTANT:
// This endpoint should return the inventory
// where ProductVariantId = NULL.
// =========================================================

async function getProductInventory(
  productId: number
): Promise<Inventory | null> {
  try {
    const response = await fetch(
      `${API}/inventory/product/${productId}`
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.status}`
      );
    }

    const data =
      await response.json();

    return (
      data?.data ??
      data?.inventory ??
      data ??
      null
    );
  } catch {
    return null;
  }
}


// =========================================================
// MAIN COMPONENT
// =========================================================

export default function InventoryManagement() {
  const [rows, setRows] =
    useState<Row[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<Filter>("all");

  const [expanded, setExpanded] =
    useState<string | null>(null);

  const [modal, setModal] =
    useState<Modal>(null);

  const [selected, setSelected] =
    useState<Row | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [transactions, setTransactions] =
    useState<InventoryTransaction[]>([]);

  const [adjust, setAdjust] =
    useState({
      quantity: "",
      transactionType: "StockIn",
      referenceType: "Purchase",
      referenceId: "",
      note: "",
    });

  const [edit, setEdit] =
    useState({
      stockQuantity: "0",
      reservedQuantity: "0",
      reorderLevel: "5",
      isActive: true,
    });


  // =======================================================
  // LOAD INVENTORY
  // =======================================================

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const products =
        await arr<Product>(
          `${API}/Products`
        );

      const out: Row[] = [];

      for (const product of products) {

        // -------------------------------------------------
        // Load variants
        // -------------------------------------------------

        let variants: Variant[] = [];

        try {
          variants =
            await arr<Variant>(
              `${API}/products/${product.id}/variants`
            );
        } catch {
          variants = [];
        }


        // -------------------------------------------------
        // Only tracked variants
        // -------------------------------------------------

        const trackedVariants =
          variants.filter(
            variant =>
              variant.trackInventory !== false
          );


        // =================================================
        // CASE 1
        // Product has tracked variants
        // =================================================

        if (trackedVariants.length > 0) {

          for (const variant of trackedVariants) {

            let inventory:
              Inventory | null = null;

            try {
              inventory =
                await inventoryService.getInventory(
                  product.id,
                  variant.id
                );
            } catch {
              inventory = null;
            }

            out.push({
              productId: product.id,

              productName: product.name,

              productSku:
                product.sku || "",

              variantId: variant.id,

              variantName:
                variant.name,

              variantSku:
                variant.sku || "",

              inventory,
            });
          }

          continue;
        }


        // =================================================
        // CASE 2
        // Simple Product
        //
        // No tracked variants.
        // =================================================

        let productInventory:
          Inventory | null = null;

        productInventory =
          await getProductInventory(
            product.id
          );


        out.push({
          productId: product.id,

          productName: product.name,

          productSku:
            product.sku || "",

          /*
           * null means this is a
           * Product-level inventory.
           */
          variantId: null,

          variantName:
            "Simple Product",

          variantSku:
            product.sku || "",

          inventory:
            productInventory,
        });
      }

      setRows(out);

    } catch (e: any) {

      setError(
        e?.message ||
        "Failed to load inventory."
      );

    } finally {
      setLoading(false);
    }
  };


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    load();
  }, []);


  // =======================================================
  // STATS
  // =======================================================

  const stats =
    useMemo(() => {

      let stock = 0;
      let reserved = 0;
      let available = 0;
      let low = 0;
      let out = 0;

      rows.forEach(row => {

        const inventory =
          row.inventory;

        if (!inventory)
          return;

        stock +=
          inventory.stockQuantity;

        reserved +=
          inventory.reservedQuantity;

        available +=
          inventory.availableQuantity;

        if (
          inventory.availableQuantity <= 0
        ) {
          out++;
        }
        else if (
          inventory.availableQuantity <=
          inventory.reorderLevel
        ) {
          low++;
        }
      });

      return {
        products: rows.length,
        stock,
        reserved,
        available,
        low,
        out,
      };

    }, [rows]);


  // =======================================================
  // FILTER
  // =======================================================

  const filtered =
    useMemo(() => {

      const query =
        search
          .toLowerCase()
          .trim();

      return rows.filter(row => {

        const inventory =
          row.inventory;

        if (
          query &&
          !`${row.productName}
             ${row.productSku}
             ${row.variantName}
             ${row.variantSku}`
            .toLowerCase()
            .includes(query)
        ) {
          return false;
        }

        if (
          filter === "inStock"
        ) {
          return (
            !!inventory &&
            inventory.availableQuantity >
              inventory.reorderLevel
          );
        }

        if (
          filter === "low"
        ) {
          return (
            !!inventory &&
            inventory.availableQuantity > 0 &&
            inventory.availableQuantity <=
              inventory.reorderLevel
          );
        }

        if (
          filter === "out"
        ) {
          return (
            !inventory ||
            inventory.availableQuantity <= 0
          );
        }

        return true;
      });

    }, [
      rows,
      search,
      filter,
    ]);


  // =======================================================
  // CLOSE MODAL
  // =======================================================

  const close = () => {

    if (saving)
      return;

    setModal(null);
    setSelected(null);
  };


  // =======================================================
  // OPEN EDIT
  // =======================================================

  const openEdit = (
    row: Row
  ) => {

    setSelected(row);

    const inventory =
      row.inventory;

    setEdit({
      stockQuantity:
        String(
          inventory?.stockQuantity ?? 0
        ),

      reservedQuantity:
        String(
          inventory?.reservedQuantity ?? 0
        ),

      reorderLevel:
        String(
          inventory?.reorderLevel ?? 5
        ),

      isActive:
        inventory?.isActive ?? true,
    });

    setModal("edit");
  };


  // =======================================================
  // OPEN ADJUST
  // =======================================================

  const openAdjust = (
    row: Row
  ) => {

    setSelected(row);

    setAdjust({
      quantity: "",
      transactionType: "StockIn",
      referenceType: "Purchase",
      referenceId: "",
      note: "",
    });

    setModal("adjust");
  };


  // =======================================================
  // HISTORY
  // =======================================================

  const history = async (
    row: Row
  ) => {

    setSelected(row);
    setTransactions([]);
    setModal("history");

    try {

      /*
       * Existing variant history API
       */
      if (
        row.variantId !== null
      ) {

        setTransactions(
          await inventoryService.getTransactions(
            row.productId,
            row.variantId
          )
        );

        return;
      }

      /*
       * Simple Product history
       *
       * Product-level history endpoint.
       */
      const response =
        await fetch(
          `${API}/inventory/product/${row.productId}/transactions`
        );

      if (!response.ok) {
        throw new Error(
          `Request failed: ${response.status}`
        );
      }

      const data =
        await response.json();

      const items =
        Array.isArray(data)
          ? data
          : data?.items ??
            data?.data ??
            [];

      setTransactions(items);

    } catch (e: any) {

      alert(
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load history."
      );
    }
  };


  // =======================================================
  // SAVE ADJUSTMENT
  // =======================================================

  const saveAdjust =
    async () => {

      if (!selected)
        return;

      const quantity =
        Number(
          adjust.quantity
        );

      if (
        !quantity ||
        quantity < 1
      ) {
        alert(
          "Enter a quantity greater than 0."
        );

        return;
      }

      const finalQuantity =
        (
          adjust.transactionType ===
            "StockOut" ||
          adjust.transactionType ===
            "Damage"
        )
          ? -quantity
          : quantity;

      try {

        setSaving(true);

        /*
         * Existing service is variant based.
         */
        if (
          selected.variantId !== null
        ) {

          await inventoryService.adjustStock(
            selected.productId,
            selected.variantId,
            {
              quantity:
                finalQuantity,

              transactionType:
                adjust.transactionType,

              referenceType:
                adjust.referenceType ||
                null,

              referenceId:
                adjust.referenceId ||
                null,

              note:
                adjust.note ||
                null,
            }
          );

        }
        else {

          /*
           * Simple Product
           *
           * Product-level adjustment endpoint.
           */
          const response =
            await fetch(
              `${API}/inventory/product/${selected.productId}/adjust`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    quantity:
                      finalQuantity,

                    transactionType:
                      adjust.transactionType,

                    referenceType:
                      adjust.referenceType ||
                      null,

                    referenceId:
                      adjust.referenceId ||
                      null,

                    note:
                      adjust.note ||
                      null,
                  }),
              }
            );

          if (!response.ok) {

            let message =
              "Failed to adjust stock.";

            try {

              const data =
                await response.json();

              message =
                data?.message ||
                data?.title ||
                message;

            } catch {}

            throw new Error(message);
          }
        }

        setModal(null);
        setSelected(null);

        await load();

        alert(
          "Stock adjusted successfully."
        );

      } catch (e: any) {

        alert(
          e?.response?.data?.message ||
          e?.response?.data?.title ||
          e?.message ||
          "Failed to adjust stock."
        );

      } finally {
        setSaving(false);
      }
    };


  // =======================================================
  // SAVE EDIT
  // =======================================================

  const saveEdit =
    async () => {

      if (!selected)
        return;

      const stock =
        Number(
          edit.stockQuantity
        );

      const reserved =
        Number(
          edit.reservedQuantity
        );

      const reorder =
        Number(
          edit.reorderLevel
        );

      if (
        stock < 0 ||
        reserved < 0 ||
        reorder < 0
      ) {
        alert(
          "Values cannot be negative."
        );

        return;
      }

      if (
        reserved > stock
      ) {
        alert(
          "Reserved quantity cannot exceed stock."
        );

        return;
      }

      try {

        setSaving(true);

        const payload = {
          stockQuantity:
            stock,

          reservedQuantity:
            reserved,

          reorderLevel:
            reorder,

          isActive:
            edit.isActive,
        };


        // =================================================
        // VARIANT INVENTORY
        // =================================================

        if (
          selected.variantId !== null
        ) {

          if (
            selected.inventory
          ) {

            await inventoryService.updateInventory(
              selected.productId,
              selected.variantId,
              payload
            );

          }
          else {

            await inventoryService.createInventory(
              selected.productId,
              selected.variantId,
              payload
            );
          }

        }

        // =================================================
        // SIMPLE PRODUCT INVENTORY
        // =================================================

        else {

          const endpoint =
            selected.inventory
              ? `${API}/inventory/product/${selected.productId}`
              : `${API}/inventory/product/${selected.productId}`;

          const response =
            await fetch(
              endpoint,
              {
                method:
                  selected.inventory
                    ? "PUT"
                    : "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    payload
                  ),
              }
            );

          if (!response.ok) {

            let message =
              "Failed to save inventory.";

            try {

              const data =
                await response.json();

              message =
                data?.message ||
                data?.title ||
                message;

            } catch {}

            throw new Error(
              message
            );
          }
        }

        setModal(null);
        setSelected(null);

        await load();

        alert(
          "Inventory saved successfully."
        );

      } catch (e: any) {

        alert(
          e?.response?.data?.message ||
          e?.response?.data?.title ||
          e?.message ||
          "Failed to save inventory."
        );

      } finally {
        setSaving(false);
      }
    };


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="min-h-screen bg-[#f5f7fa]">

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#ff6b00]">

              <Boxes size={13} />

              Stock Control

            </div>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Inventory Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage stock, reservations, availability and inventory history.
            </p>

          </div>


          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm"
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>

        </header>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {/* =================================================
            STATS
        ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <Stat
            t="Tracked Products"
            v={stats.products}
            i={<Boxes size={19} />}
          />

          <Stat
            t="Total Stock"
            v={stats.stock}
            i={<PackageOpen size={19} />}
          />

          <Stat
            t="Reserved"
            v={stats.reserved}
            i={<PackageCheck size={19} />}
          />

          <Stat
            t="Available"
            v={stats.available}
            i={<Boxes size={19} />}
          />

          <Stat
            t="Low / Out"
            v={`${stats.low} / ${stats.out}`}
            i={<AlertTriangle size={19} />}
            danger={
              stats.low + stats.out > 0
            }
          />

        </div>


        {/* =================================================
            SEARCH / FILTER
        ================================================= */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 lg:flex-row">

            <div className="relative flex-1">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={e =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search product, SKU, variant..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-orange-400"
              />

            </div>


            <div className="flex flex-wrap gap-2">

              {(
                [
                  ["all", "All"],
                  ["inStock", "In Stock"],
                  ["low", "Low Stock"],
                  ["out", "Out of Stock"],
                ] as [
                  Filter,
                  string
                ][]
              ).map(
                ([value, label]) => (

                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFilter(
                        value
                      )
                    }
                    className={`rounded-lg px-3 py-2 text-xs font-bold ${
                      filter === value
                        ? "bg-[#ff6b00] text-white"
                        : "border border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {label}
                  </button>

                )
              )}

            </div>

          </div>

        </div>


        {/* =================================================
            TABLE
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

            <div>

              <h2 className="font-bold text-slate-900">
                Inventory
              </h2>

              <p className="text-xs text-slate-400">
                {filtered.length} products / variants shown
              </p>

            </div>

            <SlidersHorizontal
              size={18}
              className="text-slate-400"
            />

          </div>


          {loading ? (

            <div className="flex min-h-[350px] items-center justify-center gap-2 text-sm text-slate-400">

              <RefreshCw
                size={18}
                className="animate-spin"
              />

              Loading inventory...

            </div>

          ) : !filtered.length ? (

            <Empty />

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1050px] text-left">

                <thead>

                  <tr className="border-b bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">

                    <th className="px-5 py-3">
                      Product / Variant
                    </th>

                    <th>
                      SKU
                    </th>

                    <th className="text-center">
                      Stock
                    </th>

                    <th className="text-center">
                      Reserved
                    </th>

                    <th className="text-center">
                      Available
                    </th>

                    <th className="text-center">
                      Reorder
                    </th>

                    <th className="text-center">
                      Status
                    </th>

                    <th className="px-5 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-100">

                  {filtered.map(row => {

                    const key =
                      `${row.productId}-${row.variantId ?? "simple"}`;

                    return (
                      <RowView
                        key={key}
                        r={row}
                        expanded={
                          expanded === key
                        }
                        expand={() =>
                          setExpanded(
                            expanded === key
                              ? null
                              : key
                          )
                        }
                        adjust={() =>
                          openAdjust(row)
                        }
                        edit={() =>
                          openEdit(row)
                        }
                        history={() =>
                          history(row)
                        }
                      />
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>


      {/* ===================================================
          MODAL
      =================================================== */}

      {modal &&
        selected && (

          <Modal
            title={
              modal === "adjust"
                ? "Adjust Stock"
                : modal === "edit"
                ? selected.inventory
                  ? "Edit Inventory"
                  : "Create Inventory"
                : "Inventory History"
            }
            subtitle={`${selected.productName} — ${selected.variantName}`}
            close={close}
            wide={
              modal === "history"
            }
          >

            {modal === "adjust" ? (

              <AdjustContent
                selected={selected}
                adjust={adjust}
                setAdjust={setAdjust}
                saving={saving}
                close={close}
                save={saveAdjust}
              />

            ) : modal === "edit" ? (

              <EditContent
                selected={selected}
                edit={edit}
                setEdit={setEdit}
                saving={saving}
                close={close}
                save={saveEdit}
              />

            ) : (

              <HistoryTable
                data={transactions}
              />

            )}

          </Modal>

        )}

    </div>
  );
}


// =========================================================
// ROW
// =========================================================

function RowView({
  r,
  expanded,
  expand,
  adjust,
  edit,
  history,
}: {
  r: Row;
  expanded: boolean;
  expand: () => void;
  adjust: () => void;
  edit: () => void;
  history: () => void;
}) {

  const inventory =
    r.inventory;

  const isSimple =
    r.variantId === null;

  return (
    <>
      <tr className="hover:bg-slate-50">

        <td className="px-5 py-4">

          <button
            type="button"
            onClick={expand}
            className="flex items-center gap-3 text-left"
          >

            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#ff6b00]">

              <Boxes size={17} />

            </span>


            <span>

              <b className="block max-w-[330px] truncate text-sm text-slate-800">

                {r.productName}

              </b>


              <span className="flex items-center gap-1 text-xs text-slate-400">

                {expanded ? (
                  <ChevronDown
                    size={13}
                  />
                ) : (
                  <ChevronRight
                    size={13}
                  />
                )}

                {isSimple
                  ? "Simple Product"
                  : r.variantName}

              </span>

            </span>

          </button>

        </td>


        <td className="text-xs text-slate-500">

          {r.variantSku ||
            r.productSku ||
            "—"}

        </td>


        <td className="text-center font-bold">

          {inventory?.stockQuantity ??
            0}

        </td>


        <td className="text-center">

          {inventory?.reservedQuantity ??
            0}

        </td>


        <td className="text-center font-bold">

          {inventory?.availableQuantity ??
            0}

        </td>


        <td className="text-center text-slate-500">

          {inventory?.reorderLevel ??
            0}

        </td>


        <td className="text-center">

          <Badge
            s={status(
              inventory
            )}
          />

        </td>


        <td className="px-5">

          <div className="flex justify-end gap-1">

            <Act
              title="Adjust"
              onClick={adjust}
            >
              <PackageCheck
                size={16}
              />
            </Act>


            <Act
              title="Edit"
              onClick={edit}
            >
              <SlidersHorizontal
                size={16}
              />
            </Act>


            <Act
              title="History"
              onClick={history}
            >
              <History
                size={16}
              />
            </Act>

          </div>

        </td>

      </tr>


      {expanded && (

        <tr>

          <td
            colSpan={8}
            className="bg-slate-50 px-5 py-4"
          >

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

              <Detail
                l="Product"
                v={r.productName}
              />

              <Detail
                l={
                  isSimple
                    ? "Type"
                    : "Variant"
                }
                v={
                  isSimple
                    ? "Simple Product"
                    : r.variantName
                }
              />

              <Detail
                l="SKU"
                v={
                  r.variantSku ||
                  r.productSku ||
                  "—"
                }
              />

              <Detail
                l="Inventory"
                v={
                  inventory
                    ? "Configured"
                    : "Not Configured"
                }
              />

            </div>

          </td>

        </tr>

      )}

    </>
  );
}


// =========================================================
// ADJUST CONTENT
// =========================================================

function AdjustContent({
  selected,
  adjust,
  setAdjust,
  saving,
  close,
  save,
}: {
  selected: Row;
  adjust: {
    quantity: string;
    transactionType: string;
    referenceType: string;
    referenceId: string;
    note: string;
  };
  setAdjust: React.Dispatch<
    React.SetStateAction<{
      quantity: string;
      transactionType: string;
      referenceType: string;
      referenceId: string;
      note: string;
    }>
  >;
  saving: boolean;
  close: () => void;
  save: () => void;
}) {

  return (
    <div className="space-y-5">

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#ff6b00] shadow-sm">

          <Boxes size={20} />

        </div>


        <div className="min-w-0 flex-1">

          <p className="truncate text-sm font-bold text-slate-900">

            {selected.productName}

          </p>


          <p className="mt-1 truncate text-xs text-slate-400">

            {selected.variantName}

            {(selected.variantSku ||
              selected.productSku) && (
              <>
                {" "}
                • SKU:{" "}
                {selected.variantSku ||
                  selected.productSku}
              </>
            )}

          </p>

        </div>


        <Badge
          s={status(
            selected.inventory
          )}
        />

      </div>


      <div>

        <div className="mb-3">

          <p className="text-sm font-bold text-slate-900">
            Current Inventory
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Current position before adjustment
          </p>

        </div>


        <div className="grid grid-cols-3 gap-3">

          <ModalStat
            label="Stock"
            value={
              selected.inventory
                ?.stockQuantity ?? 0
            }
          />

          <ModalStat
            label="Reserved"
            value={
              selected.inventory
                ?.reservedQuantity ?? 0
            }
          />

          <ModalStat
            label="Available"
            value={
              selected.inventory
                ?.availableQuantity ?? 0
            }
            accent
          />

        </div>

      </div>


      <div>

        <div className="mb-3">

          <p className="text-sm font-bold text-slate-900">
            Adjustment Type
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Choose the stock movement you want to record.
          </p>

        </div>


        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">

          {[
            [
              "StockIn",
              "Stock In",
              "Increase stock",
            ],
            [
              "StockOut",
              "Stock Out",
              "Decrease stock",
            ],
            [
              "Adjustment",
              "Adjustment",
              "Manual correction",
            ],
            [
              "Return",
              "Return",
              "Returned item",
            ],
            [
              "Damage",
              "Damage",
              "Damaged item",
            ],
          ].map(
            ([value, label, helper]) => {

              const active =
                adjust.transactionType ===
                value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setAdjust({
                      ...adjust,
                      transactionType:
                        value,
                    })
                  }
                  className={`rounded-2xl border p-3 text-left transition ${
                    active
                      ? "border-[#ff6b00] bg-orange-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >

                  <div
                    className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${
                      active
                        ? "bg-white text-[#ff6b00]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >

                    {value ===
                    "StockIn" ? (
                      <PackageCheck
                        size={16}
                      />
                    ) : value ===
                      "StockOut" ? (
                      <PackageOpen
                        size={16}
                      />
                    ) : value ===
                      "Adjustment" ? (
                      <SlidersHorizontal
                        size={16}
                      />
                    ) : value ===
                      "Return" ? (
                      <RefreshCw
                        size={16}
                      />
                    ) : (
                      <AlertTriangle
                        size={16}
                      />
                    )}

                  </div>


                  <div
                    className={`text-xs font-bold ${
                      active
                        ? "text-[#ff6b00]"
                        : "text-slate-700"
                    }`}
                  >
                    {label}
                  </div>


                  <div className="mt-1 text-[10px] leading-4 text-slate-400">
                    {helper}
                  </div>

                </button>
              );
            }
          )}

        </div>

      </div>


      <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">

        <div className="mb-2 flex items-center justify-between">

          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Quantity
          </label>

          <span className="text-[10px] font-semibold text-slate-400">
            UNITS
          </span>

        </div>


        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#ff6b00] shadow-sm">

            <Boxes size={20} />

          </div>


          <input
            autoFocus
            type="number"
            min="1"
            value={
              adjust.quantity
            }
            onChange={e =>
              setAdjust({
                ...adjust,
                quantity:
                  e.target.value,
              })
            }
            placeholder="Enter quantity"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-lg font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />

        </div>

      </div>


      <div>

        <div className="mb-3 flex items-center gap-2">

          <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b00]" />

          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Reference
          </p>

          <span className="text-[10px] text-slate-400">
            Optional
          </span>

        </div>


        <div className="grid gap-3 sm:grid-cols-2">

          <Field label="Reference Type">

            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
              value={
                adjust.referenceType
              }
              onChange={e =>
                setAdjust({
                  ...adjust,
                  referenceType:
                    e.target.value,
                })
              }
              placeholder="Purchase, Return..."
            />

          </Field>


          <Field label="Reference ID">

            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
              value={
                adjust.referenceId
              }
              onChange={e =>
                setAdjust({
                  ...adjust,
                  referenceId:
                    e.target.value,
                })
              }
              placeholder="PO-0001"
            />

          </Field>

        </div>

      </div>


      <Field label="Note">

        <textarea
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
          rows={3}
          value={
            adjust.note
          }
          onChange={e =>
            setAdjust({
              ...adjust,
              note: e.target.value,
            })
          }
          placeholder="Add a note about this stock adjustment..."
        />

      </Field>


      <Buttons
        saving={saving}
        close={close}
        save={save}
        text="Confirm Adjustment"
      />

    </div>
  );
}


// =========================================================
// EDIT CONTENT
// =========================================================

function EditContent({
  selected,
  edit,
  setEdit,
  saving,
  close,
  save,
}: {
  selected: Row;
  edit: {
    stockQuantity: string;
    reservedQuantity: string;
    reorderLevel: string;
    isActive: boolean;
  };
  setEdit: React.Dispatch<
    React.SetStateAction<{
      stockQuantity: string;
      reservedQuantity: string;
      reorderLevel: string;
      isActive: boolean;
    }>
  >;
  saving: boolean;
  close: () => void;
  save: () => void;
}) {

  return (
    <div className="space-y-5">

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#ff6b00] shadow-sm">

          <Boxes size={20} />

        </div>


        <div className="min-w-0 flex-1">

          <p className="truncate text-sm font-bold text-slate-900">
            {selected.productName}
          </p>

          <p className="mt-1 truncate text-xs text-slate-400">
            {selected.variantName}

            {(selected.variantSku ||
              selected.productSku) && (
              <>
                {" "}
                • SKU:{" "}
                {selected.variantSku ||
                  selected.productSku}
              </>
            )}

          </p>

        </div>


        <Badge
          s={status(
            selected.inventory
          )}
        />

      </div>


      <div>

        <div className="mb-3">

          <p className="text-sm font-bold text-slate-900">
            Stock Configuration
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Set the inventory quantities and reorder threshold.
          </p>

        </div>


        <div className="grid gap-3 sm:grid-cols-3">

          <Field label="Stock Quantity">

            <input
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-bold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
              type="number"
              min="0"
              value={
                edit.stockQuantity
              }
              onChange={e =>
                setEdit({
                  ...edit,
                  stockQuantity:
                    e.target.value,
                })
              }
            />

          </Field>


          <Field label="Reserved Quantity">

            <input
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-bold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
              type="number"
              min="0"
              value={
                edit.reservedQuantity
              }
              onChange={e =>
                setEdit({
                  ...edit,
                  reservedQuantity:
                    e.target.value,
                })
              }
            />

          </Field>


          <Field label="Reorder Level">

            <input
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-bold outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
              type="number"
              min="0"
              value={
                edit.reorderLevel
              }
              onChange={e =>
                setEdit({
                  ...edit,
                  reorderLevel:
                    e.target.value,
                })
              }
            />

          </Field>

        </div>

      </div>


      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
              Available Quantity
            </p>

            <p className="mt-1 text-xs text-blue-500">
              Stock − Reserved
            </p>

          </div>


          <span className="text-3xl font-black text-blue-700">

            {Math.max(
              0,
              Number(
                edit.stockQuantity ||
                  0
              ) -
                Number(
                  edit.reservedQuantity ||
                    0
                )
            )}

          </span>

        </div>

      </div>


      <button
        type="button"
        onClick={() =>
          setEdit({
            ...edit,
            isActive:
              !edit.isActive,
          })
        }
        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
          edit.isActive
            ? "border-green-200 bg-green-50"
            : "border-slate-200 bg-slate-50"
        }`}
      >

        <div className="flex items-center gap-3">

          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white ${
              edit.isActive
                ? "text-green-600"
                : "text-slate-400"
            }`}
          >

            <PackageCheck
              size={18}
            />

          </div>


          <div>

            <p className="text-sm font-bold text-slate-800">
              Inventory Tracking
            </p>

            <p className="mt-1 text-xs text-slate-400">

              {edit.isActive
                ? "Inventory is active and available for stock operations."
                : "Inventory is currently inactive."}

            </p>

          </div>

        </div>


        <span
          className={`relative h-6 w-11 rounded-full transition ${
            edit.isActive
              ? "bg-green-500"
              : "bg-slate-300"
          }`}
        >

          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
              edit.isActive
                ? "left-6"
                : "left-1"
            }`}
          />

        </span>

      </button>


      <Buttons
        saving={saving}
        close={close}
        save={save}
        text={
          selected.inventory
            ? "Save Changes"
            : "Create Inventory"
        }
      />

    </div>
  );
}


// =========================================================
// BADGE
// =========================================================

function Badge({
  s,
}: {
  s: string;
}) {

  const className =
    s === "In Stock"
      ? "bg-green-50 text-green-700 border-green-200"
      : s === "Low Stock"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : s === "Out of Stock"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${className}`}
    >
      {s}
    </span>
  );
}


// =========================================================
// MODAL STAT
// =========================================================

function ModalStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {

  return (
    <div
      className={`rounded-xl border p-3 text-center ${
        accent
          ? "border-orange-100 bg-white"
          : "border-slate-200 bg-white"
      }`}
    >

      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div
        className={`mt-1 text-lg font-black ${
          accent
            ? "text-[#ff6b00]"
            : "text-slate-800"
        }`}
      >
        {value}
      </div>

    </div>
  );
}


// =========================================================
// STAT
// =========================================================

function Stat({
  t,
  v,
  i,
  danger,
}: {
  t: string;
  v: string | number;
  i: React.ReactNode;
  danger?: boolean;
}) {

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex justify-between gap-3">

        <div>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t}
          </p>

          <p className="mt-2 text-2xl font-bold">
            {v}
          </p>

        </div>


        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            danger
              ? "bg-red-50 text-red-500"
              : "bg-orange-50 text-[#ff6b00]"
          }`}
        >
          {i}
        </span>

      </div>

    </div>
  );
}


// =========================================================
// ACTION BUTTON
// =========================================================

function Act({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {

  return (
    <button
      title={title}
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#ff6b00]"
    >
      {children}
    </button>
  );
}


// =========================================================
// DETAIL
// =========================================================

function Detail({
  l,
  v,
}: {
  l: string;
  v: string;
}) {

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">

      <div className="text-[10px] font-bold uppercase text-slate-400">
        {l}
      </div>

      <div className="mt-1 truncate text-xs font-semibold text-slate-700">
        {v}
      </div>

    </div>
  );
}


// =========================================================
// EMPTY
// =========================================================

function Empty() {

  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center text-slate-400">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">

        <PackageOpen
          size={28}
        />

      </div>


      <p className="mt-3 text-sm font-semibold text-slate-700">
        No inventory records found.
      </p>

      <p className="mt-1 text-xs text-slate-400">
        Try changing your search or filter.
      </p>

    </div>
  );
}


// =========================================================
// FIELD
// =========================================================

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {

  return (
    <label className="mb-4 block">

      <span className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
      </span>

      {children}

    </label>
  );
}


// =========================================================
// BUTTONS
// =========================================================

function Buttons({
  saving,
  close,
  save,
  text,
}: {
  saving: boolean;
  close: () => void;
  save: () => void;
  text: string;
}) {

  return (
    <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

      <button
        type="button"
        onClick={close}
        disabled={saving}
        className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>


      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff6b00] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >

        {saving && (
          <RefreshCw
            size={15}
            className="animate-spin"
          />
        )}

        {saving
          ? "Saving..."
          : text}

      </button>

    </div>
  );
}


// =========================================================
// MODAL
// =========================================================

function Modal({
  title,
  subtitle,
  close,
  children,
  wide,
}: {
  title: string;
  subtitle: string;
  close: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={event => {

        if (
          event.target ===
          event.currentTarget
        ) {
          close();
        }

      }}
    >

      <div
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)] ${
          wide
            ? "max-w-6xl"
            : "max-w-2xl"
        }`}
      >

        <div className="flex shrink-0 items-center gap-4 border-b border-slate-100 px-6 py-5">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#ff6b00]">

            {title ===
            "Adjust Stock" ? (
              <SlidersHorizontal
                size={20}
              />
            ) : title ===
              "Inventory History" ? (
              <History
                size={20}
              />
            ) : (
              <PackageCheck
                size={20}
              />
            )}

          </div>


          <div className="min-w-0 flex-1">

            <h3 className="text-lg font-black tracking-tight text-slate-900">
              {title}
            </h3>

            <p className="mt-1 truncate text-xs text-slate-400">
              {subtitle}
            </p>

          </div>


          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >

            <X size={18} />

          </button>

        </div>


        <div className="overflow-y-auto px-6 py-5">

          {children}

        </div>

      </div>

    </div>
  );
}


// =========================================================
// HISTORY TABLE
// =========================================================

function HistoryTable({
  data,
}: {
  data: InventoryTransaction[];
}) {

  if (!data.length) {

    return (
      <div className="py-12 text-center text-sm text-slate-400">
        No inventory transactions found.
      </div>
    );
  }


  return (
    <div className="overflow-auto">

      <table className="w-full min-w-[750px] text-left text-sm">

        <thead className="bg-slate-50 text-xs uppercase text-slate-500">

          <tr>

            <th className="p-3">
              Date
            </th>

            <th className="p-3">
              Type
            </th>

            <th className="p-3">
              Qty
            </th>

            <th className="p-3">
              Before
            </th>

            <th className="p-3">
              After
            </th>

            <th className="p-3">
              Reference
            </th>

            <th className="p-3">
              Note
            </th>

          </tr>

        </thead>


        <tbody className="divide-y">

          {data.map(
            transaction => (

              <tr
                key={
                  transaction.id
                }
              >

                <td className="p-3 text-xs">
                  {new Date(
                    transaction.createdAt
                  ).toLocaleString(
                    "en-BD"
                  )}
                </td>


                <td className="p-3">
                  {
                    transaction.transactionType
                  }
                </td>


                <td
                  className={`p-3 font-bold ${
                    transaction.quantity >=
                    0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {transaction.quantity >=
                  0
                    ? "+"
                    : ""}

                  {
                    transaction.quantity
                  }
                </td>


                <td className="p-3">
                  {
                    transaction.quantityBefore
                  }
                </td>


                <td className="p-3 font-bold">
                  {
                    transaction.quantityAfter
                  }
                </td>


                <td className="p-3 text-xs">
                  {[
                    transaction.referenceType,
                    transaction.referenceId,
                  ]
                    .filter(Boolean)
                    .join(" / ") ||
                    "—"}
                </td>


                <td className="p-3 text-xs">
                  {
                    transaction.note ||
                    "—"
                  }
                </td>

              </tr>

            )
          )}

        </tbody>

      </table>

    </div>
  );
}