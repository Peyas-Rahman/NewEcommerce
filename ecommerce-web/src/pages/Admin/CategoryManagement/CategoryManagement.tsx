import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  X,
  Save,
  FolderTree,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Upload,
} from "lucide-react";

import type {
  Category,
  CreateCategory,
} from "../../../types/category";

import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../services/categoryService";

/* ============================================================
   FORM
============================================================ */

const emptyForm: CreateCategory = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  parentCategoryId: null,
  isActive: true,
  isFeatured: false,
  sortOrder: 1,
};

/* ============================================================
   HELPERS
============================================================ */

const makeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const getImageUrl = (url?: string | null) => {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  return url.startsWith("/") ? url : `/${url}`;
};

const uploadCategoryImage = async (file: File) => {
  const data = new FormData();
  data.append("file", file);
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "/api"}/uploads/images`, {
    method: "POST",
    body: data,
  });
  if (!response.ok) throw new Error("Unable to upload category icon.");
  const result = await response.json();
  return result.imageUrl || result.url || result.path;
};

/*
 * The API may return a flat list or a tree with children.
 * We normalize both into a flat list and rebuild the tree locally.
 */
const flattenCategories = (
  items: Category[]
): Category[] => {
  const result: Category[] = [];

  const walk = (nodes: Category[]) => {
    nodes.forEach((node) => {
      result.push(node);

      const children =
        (node as Category & {
          children?: Category[];
        }).children;

      if (children?.length) {
        walk(children);
      }
    });
  };

  walk(items);

  return result;
};

const buildTree = (
  items: Category[]
): Category[] => {
  const flat = flattenCategories(items);

  const byId = new Map<number, Category>();

  flat.forEach((item) => {
    byId.set(item.id, {
      ...item,
      children: [],
    } as Category);
  });

  const roots: Category[] = [];

  flat.forEach((item) => {
    const current = byId.get(item.id)!;

    if (
      item.parentCategoryId !== null &&
      item.parentCategoryId !== undefined &&
      byId.has(item.parentCategoryId)
    ) {
      const parent = byId.get(
        item.parentCategoryId
      )! as Category & {
        children?: Category[];
      };

      parent.children ??= [];
      parent.children.push(current);
    } else {
      roots.push(current);
    }
  });

  const sortTree = (nodes: Category[]) => {
    nodes.sort(
      (a, b) =>
        (a.sortOrder ?? 0) -
          (b.sortOrder ?? 0) ||
        a.name.localeCompare(b.name)
    );

    nodes.forEach((node) => {
      const children =
        (node as Category & {
          children?: Category[];
        }).children;

      if (children?.length) {
        sortTree(children);
      }
    });
  };

  sortTree(roots);

  return roots;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function CategoryManagement() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<CreateCategory>(emptyForm);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [expanded, setExpanded] =
    useState<Record<number, boolean>>({});

  /* ============================================================
     LOAD
  ============================================================ */

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getAllCategories();

      setCategories(
        Array.isArray(data)
          ? data
          : []
      );

      /*
       * Keep all levels expanded after reload.
       */
      const flat = flattenCategories(
        Array.isArray(data) ? data : []
      );

      const nextExpanded: Record<
        number,
        boolean
      > = {};

      flat.forEach((category) => {
        nextExpanded[category.id] = true;
      });

      setExpanded(nextExpanded);
    } catch (err: any) {
      console.error(
        "CATEGORY LOAD ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  /* ============================================================
     FLAT + TREE
  ============================================================ */

  const flatCategories = useMemo(
    () =>
      flattenCategories(categories),
    [categories]
  );

  const categoryTree = useMemo(
    () => buildTree(categories),
    [categories]
  );

  /* ============================================================
     DESCENDANT CHECK
  ============================================================ */

  const descendantIds = useMemo(() => {
    const result = new Set<number>();

    if (editingId === null) {
      return result;
    }

    const collect = (parentId: number) => {
      flatCategories
        .filter(
          (category) =>
            category.parentCategoryId ===
            parentId
        )
        .forEach((child) => {
          result.add(child.id);
          collect(child.id);
        });
    };

    collect(editingId);

    return result;
  }, [flatCategories, editingId]);

  /* ============================================================
     PARENT OPTIONS
     ============================================================ */

  const parentOptions = useMemo(() => {
    const result: Array<{
      category: Category;
      depth: number;
    }> = [];

    const walk = (
      nodes: Category[],
      depth: number
    ) => {
      nodes.forEach((node) => {
        /*
         * When editing a category, do not allow:
         * - itself
         * - any descendant
         */
        if (
          node.id !== editingId &&
          !descendantIds.has(node.id)
        ) {
          result.push({
            category: node,
            depth,
          });
        }

        const children =
          (node as Category & {
            children?: Category[];
          }).children;

        if (children?.length) {
          walk(children, depth + 1);
        }
      });
    };

    walk(categoryTree, 0);

    return result;
  }, [
    categoryTree,
    editingId,
    descendantIds,
  ]);

  /* ============================================================
     FORM
  ============================================================ */

  const handleChange = (
    field: keyof CreateCategory,
    value: any
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleNameChange = (
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      name: value,
      slug:
        editingId === null
          ? makeSlug(value)
          : previous.slug,
    }));
  };

  /* ============================================================
     CREATE MAIN CATEGORY
  ============================================================ */

  const openCreate = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      parentCategoryId: null,
      sortOrder:
        flatCategories.length + 1,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  /* ============================================================
     CREATE CHILD
  ============================================================ */

  const openAddChild = (
    parent: Category
  ) => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      parentCategoryId: parent.id,
      sortOrder:
        flatCategories.filter(
          (x) =>
            x.parentCategoryId ===
            parent.id
        ).length + 1,
    });

    setError("");
    setSuccess("");
    setShowModal(true);

    /*
     * Make sure the parent is expanded.
     */
    setExpanded((previous) => ({
      ...previous,
      [parent.id]: true,
    }));
  };

  /* ============================================================
     EDIT
  ============================================================ */

  const openEdit = (
    category: Category
  ) => {
    setEditingId(category.id);

    setForm({
      name: category.name,
      slug: category.slug,
      description:
        category.description ?? "",
      imageUrl:
        category.imageUrl ?? "",
      parentCategoryId:
        category.parentCategoryId ??
        null,
      isActive:
        category.isActive,
      isFeatured:
        category.isFeatured,
      sortOrder:
        category.sortOrder,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  /* ============================================================
     CLOSE
  ============================================================ */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  /* ============================================================
     SAVE
  ============================================================ */

  const handleSave = async () => {
    const name = form.name.trim();

    if (!name) {
      setError(
        "Category name is required."
      );
      return;
    }

    const slug =
      form.slug.trim() ||
      makeSlug(name);

    if (!slug) {
      setError(
        "Category slug is required."
      );
      return;
    }

    /*
     * Frontend duplicate check:
     * Same parent + same slug = blocked.
     * Different parent + same slug = allowed.
     *
     * Backend also validates this.
     */
    const duplicate =
      flatCategories.some(
        (category) =>
          category.id !== editingId &&
          category.isActive !== false &&
          category.parentCategoryId ===
            (form.parentCategoryId
              ? Number(
                  form.parentCategoryId
                )
              : null) &&
          category.slug.toLowerCase() ===
            slug.toLowerCase()
      );

    if (duplicate) {
      setError(
        "A category with the same name already exists under this parent category."
      );
      return;
    }

    /*
     * Prevent circular relationship.
     */
    if (
      editingId !== null &&
      form.parentCategoryId !== null &&
      form.parentCategoryId !== undefined &&
      Number(form.parentCategoryId) !== 0 &&
      descendantIds.has(
        Number(form.parentCategoryId)
      )
    ) {
      setError(
        "Invalid parent category. This would create a circular hierarchy."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload: CreateCategory = {
        name,
        slug,
        description:
          form.description?.trim() ||
          null,
        imageUrl:
          form.imageUrl?.trim() ||
          null,
        parentCategoryId:
          form.parentCategoryId
            ? Number(
                form.parentCategoryId
              )
            : null,
        isActive:
          form.isActive,
        isFeatured:
          form.isFeatured,
        sortOrder:
          Number(form.sortOrder) || 0,
      };

      if (editingId !== null) {
        await updateCategory(
          editingId,
          payload
        );

        setSuccess(
          "Category updated successfully."
        );
      } else {
        await createCategory(
          payload
        );

        setSuccess(
          payload.parentCategoryId
            ? "Sub Category created successfully."
            : "Main Category created successfully."
        );
      }

      await loadCategories();

      setTimeout(() => {
        setShowModal(false);
        setEditingId(null);
        setForm(emptyForm);
        setSuccess("");
      }, 600);
    } catch (err: any) {
      console.error(
        "CATEGORY SAVE ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save category."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     DELETE
  ============================================================ */

  const handleDelete = async (
    category: Category
  ) => {
    const hasChildren =
      flatCategories.some(
        (x) =>
          x.parentCategoryId ===
          category.id
      );

    const message = hasChildren
      ? `This category has child categories. Deleting it will also delete its child categories. Continue?`
      : `Are you sure you want to delete "${category.name}"?`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteCategory(
        category.id
      );

      await loadCategories();

      setSuccess(
        "Category deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err: any) {
      console.error(
        "CATEGORY DELETE ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete category."
      );
    }
  };

  /* ============================================================
     EXPAND / COLLAPSE
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
     RENDER TREE
  ============================================================ */

  const renderCategories = (
    items: Category[],
    level = 0
  ) => {
    return items.map((category) => {
      const children =
        (category as Category & {
          children?: Category[];
        }).children ?? [];

      const hasChildren =
        children.length > 0;

      const isExpanded =
        expanded[category.id] ?? true;

      return (
        <div key={category.id}>
          <div
            className="
              group
              flex
              items-center
              gap-3
              border-b
              border-slate-100
              bg-white
              px-5
              py-4
              transition
              hover:bg-slate-50
            "
            style={{
              paddingLeft:
                `${20 + level * 38}px`,
            }}
          >
            {/* EXPAND */}

            {hasChildren ? (
              <button
                type="button"
                onClick={() =>
                  toggleExpanded(
                    category.id
                  )
                }
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-md
                  text-slate-500
                  hover:bg-slate-100
                "
                title={
                  isExpanded
                    ? "Collapse"
                    : "Expand"
                }
              >
                {isExpanded ? (
                  <ChevronDown
                    size={17}
                  />
                ) : (
                  <ChevronRight
                    size={17}
                  />
                )}
              </button>
            ) : (
              <div className="w-7 shrink-0" />
            )}

            {/* IMAGE */}

            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-xl
                bg-slate-100
              "
            >
              {category.imageUrl ? (
                <img
                  src={getImageUrl(
                    category.imageUrl
                  )}
                  alt={
                    category.name
                  }
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <FolderTree
                  size={20}
                  className="text-slate-400"
                />
              )}
            </div>

            {/* INFO */}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900">
                  {category.name}
                </span>

                <span
                  className="
                    rounded-full
                    bg-slate-100
                    px-2
                    py-0.5
                    text-[10px]
                    font-semibold
                    text-slate-600
                  "
                >
                  ID: {category.id}
                </span>

                {category.parentCategoryId !==
                  null &&
                  category.parentCategoryId !==
                    undefined && (
                    <span
                      className="
                        rounded-full
                        bg-blue-50
                        px-2
                        py-0.5
                        text-[10px]
                        font-semibold
                        text-blue-600
                      "
                    >
                      Child
                    </span>
                  )}
              </div>

              <div
                className="
                  mt-1
                  flex
                  flex-wrap
                  items-center
                  gap-3
                  text-xs
                  text-slate-400
                "
              >
                <span>
                  /{category.slug}
                </span>

                <span>
                  Level{" "}
                  {level + 1}
                </span>

                <span>
                  Order:{" "}
                  {category.sortOrder}
                </span>
              </div>
            </div>

            {/* STATUS */}

            <div className="hidden sm:block">
              {category.isActive ? (
                <span
                  className="
                    flex
                    items-center
                    gap-1.5
                    text-xs
                    font-medium
                    text-green-600
                  "
                >
                  <span
                    className="
                      h-2
                      w-2
                      rounded-full
                      bg-green-500
                    "
                  />
                  Active
                </span>
              ) : (
                <span
                  className="
                    flex
                    items-center
                    gap-1.5
                    text-xs
                    font-medium
                    text-slate-400
                  "
                >
                  <span
                    className="
                      h-2
                      w-2
                      rounded-full
                      bg-slate-300
                    "
                  />
                  Inactive
                </span>
              )}
            </div>

            {/* ACTIONS */}

            <div
              className="
                flex
                shrink-0
                items-center
                gap-1
              "
            >
              <button
                type="button"
                onClick={() =>
                  openAddChild(
                    category
                  )
                }
                className="
                  flex
                  h-9
                  items-center
                  gap-1
                  rounded-lg
                  px-2.5
                  text-xs
                  font-semibold
                  text-[#ff6b00]
                  hover:bg-orange-50
                "
                title="Add Child Category"
              >
                <Plus size={15} />
                <span className="hidden lg:inline">
                  Add Child
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  openEdit(
                    category
                  )
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-500
                  hover:bg-blue-50
                  hover:text-blue-600
                "
                title="Edit"
              >
                <Pencil size={16} />
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDelete(
                    category
                  )
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-500
                  hover:bg-red-50
                  hover:text-red-600
                "
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* CHILDREN */}

          {hasChildren &&
            isExpanded && (
              <div>
                {renderCategories(
                  children,
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
      {/* PAGE HEADER */}

      <div className="border-b border-slate-200 bg-white">
        <div
          className="
            mx-auto
            max-w-[1500px]
            px-5
            py-6
            lg:px-8
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#ff6b00]
                  text-white
                "
              >
                <FolderTree
                  size={21}
                />
              </div>

              <div>
                <h1
                  className="
                    text-2xl
                    font-bold
                    tracking-tight
                    text-slate-900
                  "
                >
                  Category Management
                </h1>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                  "
                >
                  Manage unlimited nested product categories.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={
                  loadCategories
                }
                disabled={loading}
                className="
                  flex
                  h-10
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  px-4
                  text-sm
                  font-medium
                  text-slate-600
                  shadow-sm
                  hover:bg-slate-50
                "
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
                onClick={
                  openCreate
                }
                className="
                  flex
                  h-10
                  items-center
                  gap-2
                  rounded-lg
                  bg-[#ff6b00]
                  px-4
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  hover:bg-[#e95f00]
                "
              >
                <Plus size={17} />
                Add Category
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <div
        className="
          mx-auto
          max-w-[1500px]
          px-5
          py-6
          lg:px-8
        "
      >
        {/* SUCCESS */}

        {success && (
          <div
            className="
              mb-5
              rounded-xl
              border
              border-green-200
              bg-green-50
              px-4
              py-3
              text-sm
              font-medium
              text-green-700
            "
          >
            {success}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div
            className="
              mb-5
              flex
              items-center
              justify-between
              gap-4
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              font-medium
              text-red-700
            "
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* STATS */}

        <div
          className="
            mb-6
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-3
          "
        >
          <StatCard
            label="Total Categories"
            value={
              flatCategories.length
            }
          />

          <StatCard
            label="Active Categories"
            value={
              flatCategories.filter(
                (x) =>
                  x.isActive
              ).length
            }
          />

          <StatCard
            label="Child Categories"
            value={
              flatCategories.filter(
                (x) =>
                  x.parentCategoryId !==
                  null &&
                  x.parentCategoryId !==
                    undefined
              ).length
            }
          />
        </div>

        {/* TABLE */}

        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
          "
        >
          {/* HEADER */}

          <div
            className="
              hidden
              grid-cols-[1fr_130px_100px_220px]
              items-center
              gap-4
              border-b
              border-slate-200
              bg-slate-50
              px-5
              py-3
              text-xs
              font-semibold
              uppercase
              tracking-wide
              text-slate-500
              md:grid
            "
          >
            <div>Category</div>
            <div>Status</div>
            <div>Level</div>
            <div className="text-right">
              Actions
            </div>
          </div>

          {/* LOADING */}

          {loading && (
            <div
              className="
                flex
                min-h-[300px]
                items-center
                justify-center
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                  text-sm
                  text-slate-500
                "
              >
                <Loader2
                  size={20}
                  className="animate-spin"
                />
                Loading categories...
              </div>
            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            flatCategories.length ===
              0 && (
              <div
                className="
                  flex
                  min-h-[300px]
                  flex-col
                  items-center
                  justify-center
                  text-center
                "
              >
                <FolderTree
                  size={40}
                  className="text-slate-300"
                />

                <h3
                  className="
                    mt-4
                    font-semibold
                    text-slate-900
                  "
                >
                  No categories found
                </h3>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                  "
                >
                  Create your first product category.
                </p>

                <button
                  type="button"
                  onClick={
                    openCreate
                  }
                  className="
                    mt-5
                    flex
                    items-center
                    gap-2
                    rounded-lg
                    bg-[#ff6b00]
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  <Plus size={16} />
                  Add Category
                </button>
              </div>
            )}

          {/* TREE */}

          {!loading &&
            categoryTree.length > 0 && (
              <div>
                {renderCategories(
                  categoryTree
                )}
              </div>
            )}
        </div>
      </div>

      {/* ========================================================
          ADD / EDIT MODAL
      ======================================================== */}

      {showModal && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-slate-950/50
            p-4
            backdrop-blur-sm
          "
        >
          <div
            className="
              max-h-[92vh]
              w-full
              max-w-2xl
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-2xl
            "
          >
            {/* HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-200
                px-6
                py-4
              "
            >
              <div>
                <h2
                  className="
                    text-lg
                    font-bold
                    text-slate-900
                  "
                >
                  {editingId !== null
                    ? "Edit Category"
                    : form.parentCategoryId
                    ? "Add Child Category"
                    : "Add Main Category"}
                </h2>

                <p
                  className="
                    mt-0.5
                    text-xs
                    text-slate-500
                  "
                >
                  {form.parentCategoryId
                    ? "Create a category under any existing category level."
                    : "Create a top-level main category."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  hover:bg-slate-100
                "
              >
                <X size={19} />
              </button>
            </div>

            {/* BODY */}

            <div
              className="
                max-h-[calc(92vh-130px)]
                overflow-y-auto
                px-6
                py-6
              "
            >
              {error && (
                <div
                  className="
                    mb-5
                    rounded-lg
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-3
                    text-sm
                    text-red-700
                  "
                >
                  {error}
                </div>
              )}

              <div
                className="
                  grid
                  grid-cols-1
                  gap-5
                  sm:grid-cols-2
                "
              >
                {/* NAME */}

                <div className="sm:col-span-2">
                  <label
                    className="
                      mb-2
                      block
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    Category Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    value={
                      form.name
                    }
                    onChange={(e) =>
                      handleNameChange(
                        e.target.value
                      )
                    }
                    placeholder="Example: Gaming Keyboard"
                    className="
                      h-11
                      w-full
                      rounded-lg
                      border
                      border-slate-200
                      px-3
                      text-sm
                      outline-none
                      focus:border-[#ff6b00]
                      focus:ring-2
                      focus:ring-orange-100
                    "
                  />
                </div>

                {/* SLUG */}

                <div>
                  <label
                    className="
                      mb-2
                      block
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    Slug *
                  </label>

                  <input
                    value={
                      form.slug
                    }
                    onChange={(e) =>
                      handleChange(
                        "slug",
                        e.target.value
                      )
                    }
                    placeholder="gaming-keyboard"
                    className="
                      h-11
                      w-full
                      rounded-lg
                      border
                      border-slate-200
                      px-3
                      text-sm
                      outline-none
                      focus:border-[#ff6b00]
                      focus:ring-2
                      focus:ring-orange-100
                    "
                  />
                </div>

                {/* PARENT */}

                <div>
                  <label
                    className="
                      mb-2
                      block
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    Parent Category
                  </label>

                  <select
                    value={
                      form.parentCategoryId ??
                      ""
                    }
                    onChange={(e) =>
                      handleChange(
                        "parentCategoryId",
                        e.target.value
                          ? Number(
                              e.target.value
                            )
                          : null
                      )
                    }
                    className="
                      h-11
                      w-full
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      px-3
                      text-sm
                      outline-none
                      focus:border-[#ff6b00]
                      focus:ring-2
                      focus:ring-orange-100
                    "
                  >
                    <option value="">
                      No Parent — Main Category
                    </option>

                    {parentOptions.map(
                      ({
                        category,
                        depth,
                      }) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {`${"— ".repeat(
                            depth
                          )}${category.name}`}
                        </option>
                      )
                    )}
                  </select>

                  <p className="mt-1.5 text-[11px] text-slate-400">
                    You can select any level as the parent.
                  </p>
                </div>

                {/* IMAGE */}

                <div>
                  <label
                    className="
                      mb-2
                      block
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    Image URL
                  </label>

                  <input
                    value={
                      form.imageUrl ??
                      ""
                    }
                    onChange={(e) =>
                      handleChange(
                        "imageUrl",
                        e.target.value
                      )
                    }
                    placeholder="https://..."
                    className="
                      h-11
                      w-full
                      rounded-lg
                      border
                      border-slate-200
                      px-3
                      text-sm
                      outline-none
                      focus:border-[#ff6b00]
                      focus:ring-2
                      focus:ring-orange-100
                    "
                  />
                  <label className="mt-2 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:border-orange-400 hover:text-orange-600">
                    <Upload size={15} /> Upload icon
                    <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { setSaving(true); handleChange("imageUrl", await uploadCategoryImage(file)); } catch (error: any) { setError(error.message || "Unable to upload category icon."); } finally { setSaving(false); } }} />
                  </label>
                </div>

                {/* SORT */}

                <div>
                  <label
                    className="
                      mb-2
                      block
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    Sort Order
                  </label>

                  <input
                    type="number"
                    min={0}
                    value={
                      form.sortOrder
                    }
                    onChange={(e) =>
                      handleChange(
                        "sortOrder",
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="
                      h-11
                      w-full
                      rounded-lg
                      border
                      border-slate-200
                      px-3
                      text-sm
                      outline-none
                      focus:border-[#ff6b00]
                      focus:ring-2
                      focus:ring-orange-100
                    "
                  />
                </div>

                {/* DESCRIPTION */}

                <div className="sm:col-span-2">
                  <label
                    className="
                      mb-2
                      block
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    Description
                  </label>

                  <textarea
                    value={
                      form.description ??
                      ""
                    }
                    onChange={(e) =>
                      handleChange(
                        "description",
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder="Category description..."
                    className="
                      w-full
                      resize-none
                      rounded-lg
                      border
                      border-slate-200
                      px-3
                      py-3
                      text-sm
                      outline-none
                      focus:border-[#ff6b00]
                      focus:ring-2
                      focus:ring-orange-100
                    "
                  />
                </div>

                {/* ACTIVE */}

                <label
                  className="
                    flex
                    cursor-pointer
                    items-center
                    gap-3
                    rounded-lg
                    border
                    border-slate-200
                    px-4
                    py-3
                  "
                >
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
                    className="
                      h-4
                      w-4
                      accent-[#ff6b00]
                    "
                  />

                  {form.isActive ? (
                    <Eye size={16} />
                  ) : (
                    <EyeOff
                      size={16}
                    />
                  )}

                  <span
                    className="
                      text-sm
                      font-medium
                      text-slate-700
                    "
                  >
                    Active Category
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => handleChange("isFeatured", e.target.checked)} className="h-4 w-4 accent-[#ff6b00]" />
                  <span className="text-sm font-medium text-slate-700">Show in Featured Category</span>
                </label>
              </div>
            </div>

            {/* FOOTER */}

            <div
              className="
                flex
                items-center
                justify-end
                gap-3
                border-t
                border-slate-200
                bg-slate-50
                px-6
                py-4
              "
            >
              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-600
                  hover:bg-slate-100
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleSave
                }
                disabled={
                  saving ||
                  !form.name.trim()
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-[#ff6b00]
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-[#e95f00]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
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
                  ? "Update Category"
                  : form.parentCategoryId
                  ? "Add Child Category"
                  : "Add Main Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
      "
    >
      <p
        className="
          text-xs
          font-medium
          uppercase
          tracking-wide
          text-slate-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-2
          text-2xl
          font-bold
          text-slate-900
        "
      >
        {value}
      </p>
    </div>
  );
}
