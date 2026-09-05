import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
  Save,
  Menu as MenuIcon,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";

import type {
  MenuItem,
  CreateMenuItem,
} from "../../../types/menu";
import type { Category } from "../../../types/category";

import {
  getAllMenus,
  createMenu,
  updateMenu,
  deleteMenu,
} from "../../../services/menuService";
import { getAllCategories } from "../../../services/categoryService";


/* ============================================================
   EMPTY FORM
============================================================ */

const emptyForm: CreateMenuItem = {
  title: "",
  url: "",
  icon: "",
  badgeText: "",
  badgeType: "",
  categoryId: null,
  parentMenuItemId: null,
  sortOrder: 1,
  isActive: true,
  showInHeader: true,
  openInNewTab: false,
};


/* ============================================================
   MENU MANAGEMENT
============================================================ */

export default function MenuManagement() {

  const [menus, setMenus] = useState<MenuItem[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<CreateMenuItem>(emptyForm);

  const [expanded, setExpanded] =
    useState<Record<number, boolean>>({});


  /* ============================================================
     LOAD MENUS
  ============================================================ */

  const loadMenus = async () => {

    try {

      setLoading(true);
      setError("");

      const data = await getAllMenus();

      setMenus(data);

    } catch (err: any) {

      console.error(err);

      setError(
        err?.response?.data?.message ||
        "Failed to load menu items."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadMenus();

    getAllCategories()
      .then(setCategories)
      .catch(() => setCategories([]));

  }, []);

  const flatCategories = useMemo(() => {
    const result: Array<{ category: Category; depth: number }> = [];
    const walk = (items: Category[], depth: number) => {
      items
        .slice()
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .forEach((category) => {
          result.push({ category, depth });
          if (category.children?.length) walk(category.children, depth + 1);
        });
    };
    walk(categories.filter((category) => !category.parentCategoryId), 0);
    const included = new Set(result.map((item) => item.category.id));
    categories.filter((category) => !included.has(category.id)).forEach((category) => result.push({ category, depth: 0 }));
    return result;
  }, [categories]);


  /* ============================================================
     FLATTEN MENU TREE
  ============================================================ */

  const flatMenus = useMemo(() => {

    const result: MenuItem[] = [];

    const walk = (items: MenuItem[]) => {

      items.forEach((item) => {

        result.push(item);

        if (item.children?.length) {
          walk(item.children);
        }

      });

    };

    walk(menus);

    return result;

  }, [menus]);


  /* ============================================================
     OPEN CREATE
  ============================================================ */

  const openCreate = () => {

    setEditingId(null);

    setForm({
      ...emptyForm,
      sortOrder: flatMenus.length + 1,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };


  /* ============================================================
     OPEN EDIT
  ============================================================ */

  const openEdit = (item: MenuItem) => {

    setEditingId(item.id);

    setForm({
      title: item.title,
      url: item.url ?? "",
      icon: item.icon ?? "",
      badgeText: item.badgeText ?? "",
      badgeType: item.badgeType ?? "",
      categoryId: item.categoryId,
      parentMenuItemId: item.parentMenuItemId,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      showInHeader: item.showInHeader,
      openInNewTab: item.openInNewTab,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };


  /* ============================================================
     CLOSE MODAL
  ============================================================ */

  const closeModal = () => {

    if (saving) return;

    setShowModal(false);

    setEditingId(null);

    setForm(emptyForm);

  };


  /* ============================================================
     HANDLE FORM
  ============================================================ */

  const handleChange = (
    field: keyof CreateMenuItem,
    value: any
  ) => {

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

  };


  /* ============================================================
     SAVE
  ============================================================ */

  const handleSave = async () => {

    if (!form.title.trim()) {

      setError("Menu title is required.");

      return;
    }

    try {

      setSaving(true);

      setError("");
      setSuccess("");

      const payload: CreateMenuItem = {
        ...form,

        title: form.title.trim(),

        url:
          form.url?.trim() || null,

        icon:
          form.icon?.trim() || null,

        badgeText:
          form.badgeText?.trim() || null,

        badgeType:
          form.badgeType?.trim() || null,

        parentMenuItemId:
          form.parentMenuItemId
            ? Number(form.parentMenuItemId)
            : null,

        categoryId:
          form.categoryId
            ? Number(form.categoryId)
            : null,

        sortOrder:
          Number(form.sortOrder),
      };


      if (editingId !== null) {

        await updateMenu(
          editingId,
          payload
        );

        setSuccess(
          "Menu updated successfully."
        );

      } else {

        await createMenu(payload);

        setSuccess(
          "Menu created successfully."
        );

      }


      await loadMenus();

      setTimeout(() => {

        setShowModal(false);

        setSuccess("");

      }, 500);

    } catch (err: any) {

      console.error(err);

      setError(
        err?.response?.data?.message ||
        "Failed to save menu item."
      );

    } finally {

      setSaving(false);

    }
  };


  /* ============================================================
     DELETE
  ============================================================ */

  const handleDelete = async (
    item: MenuItem
  ) => {

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${item.title}"?`
      );

    if (!confirmed) return;

    try {

      setError("");

      await deleteMenu(item.id);

      await loadMenus();

      setSuccess(
        "Menu deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);

    } catch (err: any) {

      console.error(err);

      setError(
        err?.response?.data?.message ||
        "Failed to delete menu item."
      );

    }
  };


  /* ============================================================
     TOGGLE EXPAND
  ============================================================ */

  const toggleExpanded = (
    id: number
  ) => {

    setExpanded((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));

  };


  /* ============================================================
     RENDER MENU TREE
  ============================================================ */

  const renderMenu = (
    items: MenuItem[],
    level = 0
  ) => {

    return items.map((item) => {

      const hasChildren =
        item.children &&
        item.children.length > 0;

      const isExpanded =
        expanded[item.id] ?? true;

      return (
        <div key={item.id}>

          {/* ==================================================
              MENU ROW
          ================================================== */}

          <div
            className="group flex items-center gap-3 border-b border-slate-100 bg-white px-5 py-4 transition hover:bg-slate-50"
            style={{
              paddingLeft:
                `${20 + level * 38}px`,
            }}
          >

            {/* Drag */}
            <GripVertical
              size={17}
              className="shrink-0 cursor-grab text-slate-300"
            />


            {/* Expand */}
            {hasChildren ? (

              <button
                type="button"
                onClick={() =>
                  toggleExpanded(item.id)
                }
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
              >

                {isExpanded ? (
                  <ChevronDown size={17} />
                ) : (
                  <ChevronRight size={17} />
                )}

              </button>

            ) : (

              <div className="w-7" />

            )}


            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">

              <MenuIcon size={19} />

            </div>


            {/* Content */}
            <div className="min-w-0 flex-1">

              <div className="flex flex-wrap items-center gap-2">

                <span className="font-semibold text-slate-900">
                  {item.title}
                </span>


                {item.badgeText && (

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      item.badgeType === "hot"
                        ? "bg-orange-100 text-orange-600"
                        : item.badgeType === "new"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.badgeText}
                  </span>

                )}

              </div>


              <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">

                <span>
                  Order: {item.sortOrder}
                </span>

                {item.url && (
                  <span className="truncate">
                    {item.url}
                  </span>
                )}

              </div>

            </div>


            {/* Header */}
            <div className="hidden items-center gap-1.5 md:flex">

              {item.showInHeader ? (

                <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-600">
                  Header
                </span>

              ) : (

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                  Hidden
                </span>

              )}

            </div>


            {/* Status */}
            <div>

              {item.isActive ? (

                <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">

                  <span className="h-2 w-2 rounded-full bg-green-500" />

                  Active

                </span>

              ) : (

                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">

                  <span className="h-2 w-2 rounded-full bg-slate-300" />

                  Inactive

                </span>

              )}

            </div>


            {/* Actions */}
            <div className="flex items-center gap-1 opacity-70 transition group-hover:opacity-100">

              <button
                type="button"
                onClick={() =>
                  openEdit(item)
                }
                title="Edit"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600"
              >
                <Pencil size={16} />
              </button>


              <button
                type="button"
                onClick={() =>
                  handleDelete(item)
                }
                title="Delete"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>

            </div>

          </div>


          {/* ==================================================
              CHILDREN
          ================================================== */}

          {hasChildren &&
            isExpanded && (

              <div>
                {renderMenu(
                  item.children,
                  level + 1
                )}
              </div>

            )}

        </div>
      );
    });
  };


  /* ============================================================
     UI
  ============================================================ */

  return (

    <div className="min-h-screen bg-[#f5f7fa]">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff6b00] text-white shadow-sm">

                  <MenuIcon size={22} />

                </div>

                <div>

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Menu Management
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your website navigation and menu structure.
                  </p>

                </div>

              </div>

            </div>


            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={loadMenus}
                disabled={loading}
                className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
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


              <button
                type="button"
                onClick={openCreate}
                className="flex h-10 items-center gap-2 rounded-lg bg-[#ff6b00] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e95f00]"
              >

                <Plus size={17} />

                Add Menu

              </button>

            </div>

          </div>

        </div>

      </div>


      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">


        {/* SUCCESS */}
        {success && (

          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">

            {success}

          </div>

        )}


        {/* ERROR */}
        {error && (

          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >
              <X size={17} />
            </button>

          </div>

        )}


        {/* ==================================================
            STATS
        ================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Menus
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {flatMenus.length}
            </p>

          </div>


          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Header Menus
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">

              {
                flatMenus.filter(
                  (x) =>
                    x.showInHeader &&
                    x.isActive
                ).length
              }

            </p>

          </div>


          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Child Menus
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">

              {
                flatMenus.filter(
                  (x) =>
                    x.parentMenuItemId !== null
                ).length
              }

            </p>

          </div>

        </div>


        {/* ==================================================
            TABLE
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Table header */}

          <div className="hidden grid-cols-[1fr_120px_110px_120px] items-center gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">

            <div>Menu Item</div>

            <div>Header</div>

            <div>Status</div>

            <div className="text-right">
              Actions
            </div>

          </div>


          {/* Loading */}

          {loading && (

            <div className="flex min-h-[300px] items-center justify-center">

              <div className="flex items-center gap-3 text-sm text-slate-500">

                <Loader2
                  size={20}
                  className="animate-spin"
                />

                Loading menus...

              </div>

            </div>

          )}


          {/* Empty */}

          {!loading &&
            menus.length === 0 && (

              <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">

                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">

                  <MenuIcon
                    size={25}
                    className="text-slate-400"
                  />

                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  No menu items found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Create your first navigation menu.
                </p>

                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 flex items-center gap-2 rounded-lg bg-[#ff6b00] px-4 py-2.5 text-sm font-semibold text-white"
                >

                  <Plus size={16} />

                  Add Menu

                </button>

              </div>

            )}


          {/* Menu tree */}

          {!loading &&
            menus.length > 0 && (

              <div>

                {renderMenu(menus)}

              </div>

            )}

        </div>

      </div>


      {/* ======================================================
          MODAL
      ====================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <div>

                <h2 className="text-lg font-bold text-slate-900">

                  {editingId !== null
                    ? "Edit Menu"
                    : "Add Menu"}

                </h2>

                <p className="mt-0.5 text-xs text-slate-500">

                  Configure your navigation menu item.

                </p>

              </div>


              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >

                <X size={19} />

              </button>

            </div>


            {/* Modal body */}

            <div className="max-h-[calc(92vh-130px)] overflow-y-auto px-6 py-6">


              {/* Error */}

              {error && (

                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                  {error}

                </div>

              )}


              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">


                {/* TITLE */}

                <div className="sm:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">

                    Menu Title
                    <span className="ml-1 text-red-500">
                      *
                    </span>

                  </label>

                  <input
                    value={form.title}
                    onChange={(e) =>
                      handleChange(
                        "title",
                        e.target.value
                      )
                    }
                    placeholder="Example: Gaming"
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-[#ff6b00] focus:ring-2 focus:ring-orange-100"
                  />

                </div>


                {/* URL */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    URL
                  </label>

                  <input
                    value={form.url ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "url",
                        e.target.value
                      )
                    }
                    placeholder="/shop/gaming"
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-[#ff6b00] focus:ring-2 focus:ring-orange-100"
                  />

                </div>


                {/* ICON */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Icon
                  </label>

                  <input
                    value={form.icon ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "icon",
                        e.target.value
                      )
                    }
                    placeholder="gamepad"
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-[#ff6b00] focus:ring-2 focus:ring-orange-100"
                  />

                </div>


                {/* PARENT */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Parent Menu
                  </label>

                  <select
                    value={
                      form.parentMenuItemId ?? ""
                    }
                    onChange={(e) =>
                      handleChange(
                        "parentMenuItemId",
                        e.target.value
                          ? Number(e.target.value)
                          : null
                      )
                    }
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#ff6b00] focus:ring-2 focus:ring-orange-100"
                  >

                    <option value="">
                      No Parent — Main Menu
                    </option>

                    {flatMenus
                      .filter(
                        (item) =>
                          item.id !== editingId
                      )
                      .map((item) => (

                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.title}
                        </option>

                      ))}

                  </select>

                </div>


                {/* SORT ORDER */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Sort Order
                  </label>

                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) =>
                      handleChange(
                        "sortOrder",
                        Number(e.target.value)
                      )
                    }
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-[#ff6b00] focus:ring-2 focus:ring-orange-100"
                  />

                </div>


                {/* BADGE TEXT */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Badge Text
                  </label>

                  <input
                    value={form.badgeText ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "badgeText",
                        e.target.value
                      )
                    }
                    placeholder="HOT / NEW"
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-[#ff6b00] focus:ring-2 focus:ring-orange-100"
                  />

                </div>


                {/* BADGE TYPE */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Badge Type
                  </label>

                  <select
                    value={form.badgeType ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "badgeType",
                        e.target.value
                      )
                    }
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#ff6b00] focus:ring-2 focus:ring-orange-100"
                  >

                    <option value="">
                      None
                    </option>

                    <option value="hot">
                      HOT
                    </option>

                    <option value="new">
                      NEW
                    </option>

                    <option value="sale">
                      SALE
                    </option>

                  </select>

                </div>


                {/* CATEGORY */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Category
                  </label>

                  <select
                    value={form.categoryId ?? ""}
                    onChange={(e) => handleChange("categoryId", e.target.value ? Number(e.target.value) : null)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#ff6b00] focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">No category</option>
                    {flatCategories.map(({ category, depth }) => (
                      <option key={category.id} value={category.id}>
                        {`${"— ".repeat(depth)}${category.name} (ID: ${category.id})`}
                      </option>
                    ))}
                  </select>

                </div>


                {/* NEW TAB */}

                <div className="flex items-center rounded-lg border border-slate-200 px-4">

                  <label className="flex cursor-pointer items-center gap-3 py-3">

                    <input
                      type="checkbox"
                      checked={
                        form.openInNewTab
                      }
                      onChange={(e) =>
                        handleChange(
                          "openInNewTab",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 accent-[#ff6b00]"
                    />

                    <span className="text-sm font-medium text-slate-700">

                      Open in new tab

                    </span>

                    <ExternalLink
                      size={15}
                      className="text-slate-400"
                    />

                  </label>

                </div>


                {/* ACTIVE */}

                <div className="flex items-center rounded-lg border border-slate-200 px-4">

                  <label className="flex cursor-pointer items-center gap-3 py-3">

                    <input
                      type="checkbox"
                      checked={
                        form.isActive
                      }
                      onChange={(e) =>
                        handleChange(
                          "isActive",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 accent-[#ff6b00]"
                    />

                    {form.isActive ? (
                      <Eye size={16} />
                    ) : (
                      <EyeOff size={16} />
                    )}

                    <span className="text-sm font-medium text-slate-700">

                      Active

                    </span>

                  </label>

                </div>


                {/* SHOW HEADER */}

                <div className="flex items-center rounded-lg border border-slate-200 px-4">

                  <label className="flex cursor-pointer items-center gap-3 py-3">

                    <input
                      type="checkbox"
                      checked={
                        form.showInHeader
                      }
                      onChange={(e) =>
                        handleChange(
                          "showInHeader",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 accent-[#ff6b00]"
                    />

                    <MenuIcon size={16} />

                    <span className="text-sm font-medium text-slate-700">

                      Show in header

                    </span>

                  </label>

                </div>

              </div>

            </div>


            {/* Modal footer */}

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#ff6b00] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#e95f00] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {saving ? (

                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                ) : (

                  <Save size={17} />

                )}

                {editingId !== null
                  ? "Update Menu"
                  : "Create Menu"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}