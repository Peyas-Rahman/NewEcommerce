import {
  CheckCircle2,
  Edit3,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../../services/api";


// ============================================================
// TYPES
// ============================================================

interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface BrandForm {
  name: string;
  description: string;
  logoUrl: string;
  isActive: boolean;
  sortOrder: number;
}


// ============================================================
// INITIAL FORM
// ============================================================

const emptyForm: BrandForm = {
  name: "",
  description: "",
  logoUrl: "",
  isActive: true,
  sortOrder: 1,
};


// ============================================================
// COMPONENT
// ============================================================

export default function BrandManagement() {
  const [brands, setBrands] =
    useState<Brand[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingBrand, setEditingBrand] =
    useState<Brand | null>(null);

  const [form, setForm] =
    useState<BrandForm>(emptyForm);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"all" | "active" | "inactive">(
      "all"
    );

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================================
  // LOAD BRANDS
  // ==========================================================

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<Brand[]>("/Brands");

      const data = response.data;

      setBrands(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err: any) {
      console.error(
        "Failed to load brands:",
        err
      );

      setBrands([]);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.title ||
          err?.message ||
          "Failed to load brands."
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadBrands();
  }, []);


  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredBrands =
    useMemo(() => {
      const keyword =
        search.trim().toLowerCase();

      return brands.filter((brand) => {
        const matchesSearch =
          !keyword ||
          brand.name
            ?.toLowerCase()
            .includes(keyword) ||
          brand.slug
            ?.toLowerCase()
            .includes(keyword);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" &&
            brand.isActive) ||
          (statusFilter === "inactive" &&
            !brand.isActive);

        return (
          matchesSearch &&
          matchesStatus
        );
      });
    }, [
      brands,
      search,
      statusFilter,
    ]);


  // ==========================================================
  // STATS
  // ==========================================================

  const activeCount =
    brands.filter(
      (x) => x.isActive
    ).length;

  const inactiveCount =
    brands.filter(
      (x) => !x.isActive
    ).length;


  // ==========================================================
  // OPEN CREATE
  // ==========================================================

  const openCreate = () => {
    setEditingBrand(null);

    setForm({
      ...emptyForm,
      sortOrder:
        brands.length + 1,
    });

    setError("");
    setSuccess("");

    setModalOpen(true);
  };


  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  const openEdit = (
    brand: Brand
  ) => {
    setEditingBrand(brand);

    setForm({
      name:
        brand.name || "",

      description:
        brand.description || "",

      logoUrl:
        brand.logoUrl || "",

      isActive:
        brand.isActive,

      sortOrder:
        brand.sortOrder || 1,
    });

    setError("");
    setSuccess("");

    setModalOpen(true);
  };


  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const closeModal = () => {
    if (saving)
      return;

    setModalOpen(false);
    setEditingBrand(null);
    setForm(emptyForm);
  };


  // ==========================================================
  // FORM UPDATE
  // ==========================================================

  const updateField = <
    K extends keyof BrandForm
  >(
    field: K,
    value: BrandForm[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };


  // ==========================================================
  // SAVE
  // ==========================================================

  const saveBrand = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const name =
      form.name.trim();

    if (!name) {
      setError(
        "Brand name is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name,

        description:
          form.description.trim() ||
          null,

        logoUrl:
          form.logoUrl.trim() ||
          null,

        isActive:
          form.isActive,

        sortOrder:
          Number(form.sortOrder) || 0,
      };


      // ------------------------------------------------------
      // UPDATE
      // ------------------------------------------------------

      if (editingBrand) {
        await api.put(
          `/Brands/${editingBrand.id}`,
          payload
        );

        setSuccess(
          "Brand updated successfully."
        );
      }


      // ------------------------------------------------------
      // CREATE
      // ------------------------------------------------------

      else {
        await api.post(
          "/Brands",
          payload
        );

        setSuccess(
          "Brand created successfully."
        );
      }

      setModalOpen(false);
      setEditingBrand(null);
      setForm(emptyForm);

      await loadBrands();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      console.error(
        "Brand save failed:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.title ||
          err?.message ||
          "Failed to save brand."
      );
    } finally {
      setSaving(false);
    }
  };


  // ==========================================================
  // DELETE
  // ==========================================================

  const deleteBrand = async (
    brand: Brand
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${brand.name}"?`
      );

    if (!confirmed)
      return;

    try {
      setDeletingId(brand.id);
      setError("");
      setSuccess("");

      await api.delete(
        `/Brands/${brand.id}`
      );

      setSuccess(
        "Brand deleted successfully."
      );

      await loadBrands();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      console.error(
        "Brand delete failed:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.title ||
          err?.message ||
          "Failed to delete brand."
      );
    } finally {
      setDeletingId(null);
    }
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-[calc(100vh-76px)] bg-[#f5f7fa] p-4 sm:p-6 lg:p-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff6b00]">
            Catalog Management
          </p>

          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Brands
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your product brands,
            logos and visibility.
          </p>
        </div>


        <div className="flex gap-2">

          <button
            type="button"
            onClick={loadBrands}
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>


          <button
            type="button"
            onClick={openCreate}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff6b00] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#e85f00] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />

            Add Brand
          </button>

        </div>

      </div>


      {/* ======================================================
          ALERTS
      ====================================================== */}

      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            {error}
          </div>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X className="h-4 w-4" />
          </button>

        </div>
      )}


      {success && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

          <CheckCircle2 className="h-5 w-5" />

          {success}

        </div>
      )}


      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <StatCard
          label="Total Brands"
          value={brands.length}
          icon={
            <ImageIcon className="h-5 w-5" />
          }
        />

        <StatCard
          label="Active Brands"
          value={activeCount}
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
        />

        <StatCard
          label="Inactive Brands"
          value={inactiveCount}
          icon={
            <XCircle className="h-5 w-5" />
          }
        />

      </div>


      {/* ======================================================
          FILTER BAR
      ====================================================== */}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative w-full lg:max-w-md">

            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search brand name or slug..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
            />

          </div>


          <div className="flex gap-2">

            {(
              [
                ["all", "All"],
                ["active", "Active"],
                ["inactive", "Inactive"],
              ] as const
            ).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      value
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                    statusFilter === value
                      ? "bg-orange-50 text-[#ff6b00]"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              )
            )}

          </div>

        </div>

      </div>


      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* TABLE HEADER */}

        <div className="hidden grid-cols-[minmax(260px,1fr)_140px_100px_120px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 md:grid">

          <span>
            Brand
          </span>

          <span>
            Status
          </span>

          <span>
            Order
          </span>

          <span className="text-right">
            Actions
          </span>

        </div>


        {/* LOADING */}

        {loading && (
          <div className="flex min-h-[260px] items-center justify-center">

            <div className="flex items-center gap-3 text-sm text-slate-500">

              <Loader2 className="h-5 w-5 animate-spin text-[#ff6b00]" />

              Loading brands...

            </div>

          </div>
        )}


        {/* EMPTY */}

        {!loading &&
          filteredBrands.length === 0 && (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                <ImageIcon className="h-6 w-6" />

              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-800">
                No brands found
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                {search
                  ? "Try a different search term."
                  : "Create your first brand to get started."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 rounded-lg bg-orange-50 px-3 py-2 text-xs font-bold text-[#ff6b00]"
                >
                  Add Brand
                </button>
              )}

            </div>
          )}


        {/* DESKTOP ROWS */}

        {!loading &&
          filteredBrands.map(
            (brand) => (
              <div
                key={brand.id}
                className="hidden grid-cols-[minmax(260px,1fr)_140px_100px_120px] items-center border-b border-slate-100 px-5 py-4 last:border-0 md:grid"
              >

                {/* BRAND */}

                <div className="flex min-w-0 items-center gap-3">

                  <BrandLogo
                    brand={brand}
                  />

                  <div className="min-w-0">

                    <p className="truncate text-sm font-bold text-slate-900">
                      {brand.name}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      /{brand.slug}
                    </p>

                    {brand.description && (
                      <p className="mt-1 max-w-xl truncate text-xs text-slate-400">
                        {brand.description}
                      </p>
                    )}

                  </div>

                </div>


                {/* STATUS */}

                <div>

                  {brand.isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">

                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                      Active

                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">

                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />

                      Inactive

                    </span>
                  )}

                </div>


                {/* SORT */}

                <div className="text-sm font-semibold text-slate-600">
                  {brand.sortOrder}
                </div>


                {/* ACTIONS */}

                <div className="flex justify-end gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      openEdit(brand)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#ff6b00]"
                    title="Edit brand"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>


                  <button
                    type="button"
                    disabled={
                      deletingId ===
                      brand.id
                    }
                    onClick={() =>
                      deleteBrand(
                        brand
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Delete brand"
                  >
                    {deletingId ===
                    brand.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>

                </div>

              </div>
            )
          )}


        {/* MOBILE CARDS */}

        {!loading &&
          filteredBrands.map(
            (brand) => (
              <div
                key={`mobile-${brand.id}`}
                className="border-b border-slate-100 p-4 last:border-0 md:hidden"
              >

                <div className="flex items-start gap-3">

                  <BrandLogo
                    brand={brand}
                  />

                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <p className="truncate text-sm font-bold text-slate-900">
                          {brand.name}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          /{brand.slug}
                        </p>

                      </div>

                      {brand.isActive ? (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">
                          Inactive
                        </span>
                      )}

                    </div>


                    {brand.description && (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
                        {brand.description}
                      </p>
                    )}


                    <div className="mt-3 flex items-center justify-between">

                      <span className="text-[10px] font-semibold text-slate-400">
                        Sort Order:{" "}
                        <span className="text-slate-600">
                          {brand.sortOrder}
                        </span>
                      </span>


                      <div className="flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(
                              brand
                            )
                          }
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600"
                        >
                          <Edit3 className="h-3.5 w-3.5" />

                          Edit
                        </button>


                        <button
                          type="button"
                          disabled={
                            deletingId ===
                            brand.id
                          }
                          onClick={() =>
                            deleteBrand(
                              brand
                            )
                          }
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-red-100 px-3 text-xs font-semibold text-red-600"
                        >
                          {deletingId ===
                          brand.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}

                          Delete
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              </div>
            )
          )}

      </div>


      {/* ======================================================
          MODAL
      ====================================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]">

          <div className="max-h-[92vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff6b00]">
                  Brand Management
                </p>

                <h2 className="mt-0.5 text-lg font-black text-slate-900">
                  {editingBrand
                    ? "Edit Brand"
                    : "Add New Brand"}
                </h2>

              </div>


              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            {/* MODAL BODY */}

            <form
              onSubmit={saveBrand}
              className="max-h-[calc(92vh-80px)] overflow-y-auto p-5"
            >

              <div className="space-y-5">

                {/* NAME */}

                <div>

                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Brand Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Logitech"
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  />

                </div>


                {/* DESCRIPTION */}

                <div>

                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Short description about this brand..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  />

                </div>


                {/* LOGO URL */}

                <div>

                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    Logo URL
                  </label>

                  <input
                    type="url"
                    value={
                      form.logoUrl
                    }
                    onChange={(event) =>
                      updateField(
                        "logoUrl",
                        event.target.value
                      )
                    }
                    placeholder="https://example.com/logo.png"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  />

                  {form.logoUrl && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">

                      <img
                        src={
                          form.logoUrl
                        }
                        alt=""
                        className="h-12 w-12 rounded-lg object-contain bg-white"
                        onError={(
                          event
                        ) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />

                      <div className="min-w-0">

                        <p className="text-xs font-semibold text-slate-600">
                          Logo preview
                        </p>

                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                          {form.logoUrl}
                        </p>

                      </div>

                    </div>
                  )}

                </div>


                {/* SORT + STATUS */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <div>

                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Sort Order
                    </label>

                    <input
                      type="number"
                      min={0}
                      value={
                        form.sortOrder
                      }
                      onChange={(event) =>
                        updateField(
                          "sortOrder",
                          Number(
                            event.target
                              .value
                          )
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                    />

                  </div>


                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                    <input
                      type="checkbox"
                      checked={
                        form.isActive
                      }
                      onChange={(event) =>
                        updateField(
                          "isActive",
                          event.target
                            .checked
                        )
                      }
                      className="h-4 w-4 accent-[#ff6b00]"
                    />

                    <span>

                      <span className="block text-xs font-bold text-slate-700">
                        Active Brand
                      </span>

                      <span className="block text-[10px] text-slate-400">
                        Show this brand in the catalog
                      </span>

                    </span>

                  </label>

                </div>

              </div>


              {/* FORM ERROR */}

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}


              {/* ACTIONS */}

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={saving}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff6b00] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#e85f00] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {editingBrand
                    ? "Update Brand"
                    : "Create Brand"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-black text-slate-900">
            {value}
          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#ff6b00]">
          {icon}
        </div>

      </div>

    </div>
  );
}


// ============================================================
// BRAND LOGO
// ============================================================

function BrandLogo({
  brand,
}: {
  brand: Brand;
}) {
  const [failed, setFailed] =
    useState(false);

  if (
    !brand.logoUrl ||
    failed
  ) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-500">
        {brand.name
          ?.charAt(0)
          ?.toUpperCase() || "B"}
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">

      <img
        src={brand.logoUrl}
        alt={brand.name}
        className="h-full w-full object-contain p-1.5"
        onError={() =>
          setFailed(true)
        }
      />

    </div>
  );
}