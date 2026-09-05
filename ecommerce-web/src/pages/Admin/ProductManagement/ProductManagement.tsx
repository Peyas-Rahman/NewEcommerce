import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  FormEvent,
  ReactNode,
  RefObject,
} from "react";

import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Image as ImageIcon,
  Upload,
  Star,
  Trophy,
  Sparkles,
  Eye,
  Save,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Check,
} from "lucide-react";

import productService from "../../../services/productService";

import type {
  Product,
  ProductImage,
  ProductVariant,
} from "../../../types/product";


// ============================================================
// TYPES
// ============================================================

interface Category {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  parentCategoryId?: number | null;
  isActive?: boolean;
  sortOrder?: number;
}

interface Brand {
  id: number;
  name: string;
}

interface ProductForm {
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  discountPrice: number | null;
  warranty: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  sortOrder: number;
  categoryId: number;
  brandId: number | null;
}

interface VariantForm {
  name: string;
  sku: string;
  price: string;
  discountPrice: string;
  trackInventory: boolean;
  isActive: boolean;
  sortOrder: number;
}


// ============================================================
// DEFAULT VALUES
// ============================================================

const emptyProduct: ProductForm = {
  name: "",
  shortDescription: "",
  description: "",
  price: 0,
  discountPrice: null,
  warranty: "",
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: false,
  isActive: true,
  sortOrder: 1,
  categoryId: 0,
  brandId: null,
};

const emptyVariant: VariantForm = {
  name: "",
  sku: "",
  price: "",
  discountPrice: "",
  trackInventory: true,
  isActive: true,
  sortOrder: 1,
};


// ============================================================
// COMPONENT
// ============================================================

export default function ProductManagement() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [brands, setBrands] =
    useState<Brand[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [form, setForm] =
    useState<ProductForm>(emptyProduct);

  const [images, setImages] =
    useState<ProductImage[]>([]);

  const [variants, setVariants] =
    useState<ProductVariant[]>([]);

  const [selectedFiles, setSelectedFiles] =
    useState<File[]>([]);

  const [variant, setVariant] =
    useState<VariantForm>(emptyVariant);

  // Category / Sub Category quick-create modal
  const [categoryModalOpen, setCategoryModalOpen] =
    useState(false);

  const [categoryModalMode, setCategoryModalMode] =
    useState<"category" | "subcategory">("category");

  const [newCategoryName, setNewCategoryName] =
    useState("");

  const [newCategoryDescription, setNewCategoryDescription] =
    useState("");

  const [newCategoryParentId, setNewCategoryParentId] =
    useState<number>(0);

  const [creatingCategory, setCreatingCategory] =
    useState(false);


  // ============================================================
  // EDITOR REFS
  // ============================================================

  const shortDescriptionRef =
    useRef<HTMLDivElement>(null);

  const descriptionRef =
    useRef<HTMLDivElement>(null);


  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    loadData();
  }, []);


const loadData = async () => {
  try {
    setLoading(true);
    setError("");

    const productData =
      await productService.getAll();

    // ========================================================
    // LOAD IMAGES FOR EACH PRODUCT
    // ========================================================

    const productsWithImages =
      await Promise.all(
        (Array.isArray(productData)
          ? productData
          : []
        ).map(async (product: Product) => {
          try {
            const imageData =
              await productService.getImages(
                product.id
              );

            return {
              ...product,
              images: Array.isArray(imageData)
                ? imageData
                : [],
            };
          } catch (imageError) {
            console.error(
              `Failed to load images for product ${product.id}:`,
              imageError
            );

            return {
              ...product,
              images: [],
            };
          }
        })
      );

    console.log(
      "PRODUCTS WITH IMAGES:",
      productsWithImages
    );

    // ========================================================
    // LOAD CATEGORIES
    // ========================================================

    let categoryData: Category[] = [];

    try {
      const response =
        await fetch(
          "https://localhost:7090/api/categories"
        );

      if (response.ok) {
        categoryData =
          await response.json();
      }
    } catch (categoryError) {
      console.error(
        "Category loading failed:",
        categoryError
      );
    }

    // ========================================================
    // LOAD BRANDS
    // ========================================================

    let brandData: Brand[] = [];

    try {
      const response =
        await fetch(
          "https://localhost:7090/api/brands"
        );

      if (response.ok) {
        brandData =
          await response.json();
      }
    } catch (brandError) {
      console.error(
        "Brand loading failed:",
        brandError
      );
    }

    // ========================================================
    // SET STATE
    // ========================================================

    setProducts(
      productsWithImages
    );

    setCategories(
      Array.isArray(categoryData)
        ? categoryData
        : []
    );

    setBrands(
      Array.isArray(brandData)
        ? brandData
        : []
    );

  } catch (err: any) {
    console.error(
      "PRODUCT DATA LOADING ERROR:",
      err
    );

    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to load product data."
    );
  } finally {
    setLoading(false);
  }
};

  // ============================================================
  // CATEGORY HELPERS
  // Unlimited hierarchy: Parent -> Child -> Grandchild -> ...
  // A category is selectable only when it has no active children.
  // ============================================================

  const activeCategories = categories.filter(
    (category) => category.isActive !== false
  );

  const getChildren = (parentId: number | null) =>
    activeCategories
      .filter(
        (category) =>
          (category.parentCategoryId ?? null) ===
          parentId
      )
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) -
            (b.sortOrder ?? 0) ||
          a.name.localeCompare(b.name)
      );

  const getCategoryOptions = () => {
    const result: Array<{
      category: Category;
      depth: number;
      hasChildren: boolean;
    }> = [];

    const walk = (
      parentId: number | null,
      depth: number
    ) => {
      const children = getChildren(parentId);

      children.forEach((category) => {
        const categoryChildren =
          getChildren(category.id);

        result.push({
          category,
          depth,
          hasChildren:
            categoryChildren.length > 0,
        });

        walk(category.id, depth + 1);
      });
    };

    walk(null, 0);

    return result;
  };

  const categoryOptions =
    getCategoryOptions();

  const selectedCategory =
    categories.find(
      (category) =>
        category.id === form.categoryId
    );

  const getCategoryPath = (
    categoryId: number
  ): string => {
    const path: string[] = [];
    const visited = new Set<number>();
    let currentId: number | null = categoryId;

    while (currentId !== null) {
      if (visited.has(currentId)) {
        break;
      }

      visited.add(currentId);

      const category = categories.find(
        (item) => item.id === currentId
      );

      if (!category) {
        break;
      }

      path.unshift(category.name);
      currentId =
        category.parentCategoryId ?? null;
    }

    return path.join(" / ");
  };

  const selectedCategoryPath =
    form.categoryId > 0
      ? getCategoryPath(form.categoryId)
      : "";

  const getDepthLabel = (
    depth: number,
    name: string
  ) => {
    if (depth === 0) {
      return name;
    }

    return `${"   ".repeat(depth)}└─ ${name}`;
  };

  const openAddCategory = () => {
    setCategoryModalMode("category");
    setNewCategoryName("");
    setNewCategoryDescription("");
    setNewCategoryParentId(0);
    setError("");
    setCategoryModalOpen(true);
  };

  const openAddSubCategory = () => {
    setCategoryModalMode("subcategory");
    setNewCategoryName("");
    setNewCategoryDescription("");
    setNewCategoryParentId(
      selectedCategory?.id ||
      activeCategories[0]?.id ||
      0
    );
    setError("");
    setCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    if (creatingCategory) {
      return;
    }

    setCategoryModalOpen(false);
    setNewCategoryName("");
    setNewCategoryDescription("");
    setNewCategoryParentId(0);
  };

  const createCategoryInline = async () => {
    const name = newCategoryName.trim();

    if (!name) {
      setError(
        categoryModalMode === "category"
          ? "Category name is required."
          : "Sub Category name is required."
      );
      return;
    }

    if (
      categoryModalMode === "subcategory" &&
      !newCategoryParentId
    ) {
      setError(
        "Please select a Main Category."
      );
      return;
    }

    try {
      setCreatingCategory(true);
      setError("");
      setSuccess("");

      const payload = {
        name,
        description:
          newCategoryDescription.trim() || null,
        imageUrl: null,
        parentCategoryId:
          categoryModalMode === "subcategory"
            ? Number(newCategoryParentId)
            : null,
        isActive: true,
        sortOrder:
          categories.length + 1,
      };

      const response = await fetch(
        "https://localhost:7090/api/categories",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData =
        await response.json().catch(
          () => null
        );

      if (!response.ok) {
        throw new Error(
          responseData?.message ||
            "Failed to create category."
        );
      }

      const createdCategory =
        responseData?.data ||
        responseData;

      if (!createdCategory?.id) {
        throw new Error(
          "Category was created but its ID was not returned."
        );
      }

      // Add newly-created category immediately to dropdown.
      setCategories((previous) => [
        ...previous,
        createdCategory,
      ]);

      // If Sub Category was created, select it.
      // If Main Category was created and it has no children,
      // select it because Main Category is selectable when
      // no Sub Category exists.
      setForm((previous) => ({
        ...previous,
        categoryId:
          Number(createdCategory.id),
      }));

      setCategoryModalOpen(false);

      setNewCategoryName("");
      setNewCategoryDescription("");
      setNewCategoryParentId(0);

      setSuccess(
        categoryModalMode === "category"
          ? "Category added successfully."
          : "Sub Category added successfully."
      );
    } catch (err: any) {
      console.error(
        "CATEGORY CREATE ERROR:",
        err
      );

      setError(
        err?.message ||
          "Failed to create category."
      );
    } finally {
      setCreatingCategory(false);
    }
  };


  // ============================================================
  // FORM UPDATE
  // ============================================================

  const updateForm = (
    field: keyof ProductForm,
    value: any
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };


  // ============================================================
  // OPEN CREATE
  // ============================================================

  const openCreate = () => {
    setEditingId(null);

    setForm({
      ...emptyProduct,
      sortOrder:
        products.length + 1,
    });

    setImages([]);
    setVariants([]);
    setSelectedFiles([]);
    setVariant(emptyVariant);

    setError("");
    setSuccess("");

    setModalOpen(true);

    setTimeout(() => {
      if (shortDescriptionRef.current) {
        shortDescriptionRef.current.innerHTML =
          "";
      }

      if (descriptionRef.current) {
        descriptionRef.current.innerHTML =
          "";
      }
    }, 50);
  };


  // ============================================================
  // OPEN EDIT
  // ============================================================

  const openEdit = async (
    product: Product
  ) => {
    try {
      setError("");
      setSuccess("");

      setEditingId(product.id);

      setForm({
        name:
          product.name || "",

        shortDescription:
          product.shortDescription || "",

        description:
          product.description || "",

        price:
          product.price || 0,

        discountPrice:
          product.discountPrice ?? null,

        warranty:
          product.warranty || "",

        isFeatured:
          product.isFeatured,

        isBestSeller:
          product.isBestSeller,

        isNewArrival:
          product.isNewArrival,

        isActive:
          product.isActive,

        sortOrder:
          product.sortOrder || 1,

        categoryId:
          product.categoryId,

        brandId:
          product.brandId ?? null,
      });

      setImages(
        Array.isArray(product.images)
          ? product.images
          : []
      );

      setVariants(
        Array.isArray(product.variants)
          ? product.variants
          : []
      );

      setSelectedFiles([]);

      setVariant({
        ...emptyVariant,
        sortOrder:
          (product.variants?.length || 0) + 1,
      });

      setModalOpen(true);

      // Load latest images and variants
      try {
        const [
          imageData,
          variantData,
        ] = await Promise.all([
          productService.getImages(
            product.id
          ),
          productService.getVariants(
            product.id
          ),
        ]);

        if (Array.isArray(imageData)) {
          setImages(imageData);
        }

        if (Array.isArray(variantData)) {
          setVariants(variantData);
        }
      } catch {
        // Product response data will remain available
      }

      setTimeout(() => {
        if (shortDescriptionRef.current) {
          shortDescriptionRef.current.innerHTML =
            product.shortDescription || "";
        }

        if (descriptionRef.current) {
          descriptionRef.current.innerHTML =
            product.description || "";
        }
      }, 100);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load product."
      );
    }
  };


  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const closeModal = () => {
    if (saving || uploading) {
      return;
    }

    setModalOpen(false);
    setEditingId(null);

    setImages([]);
    setVariants([]);
    setSelectedFiles([]);

    setVariant(emptyVariant);

    setError("");
    setSuccess("");
  };


  // ============================================================
  // SAVE PRODUCT
  // ============================================================

  const saveProduct = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError(
        "Product name is required."
      );
      return;
    }

    if (!form.categoryId) {
      setError(
        "Please select a category."
      );
      return;
    }

    if (form.price <= 0) {
      setError(
        "Price must be greater than 0."
      );
      return;
    }

    try {
      setSaving(true);

      // Get latest editor HTML
      const shortDescription =
        shortDescriptionRef.current
          ?.innerHTML || "";

      const description =
        descriptionRef.current
          ?.innerHTML || "";

      const payload = {
        name:
          form.name.trim(),

        shortDescription:
          shortDescription.trim()
            ? shortDescription
            : null,

        description:
          description.trim()
            ? description
            : null,

        price:
          Number(form.price),

        discountPrice:
          form.discountPrice !== null &&
          form.discountPrice !== undefined &&
          form.discountPrice !== 0
            ? Number(form.discountPrice)
            : null,

        warranty:
          form.warranty.trim()
            ? form.warranty.trim()
            : null,

        isFeatured:
          form.isFeatured,

        isBestSeller:
          form.isBestSeller,

        isNewArrival:
          form.isNewArrival,

        isActive:
          form.isActive,

        sortOrder:
          Number(form.sortOrder),

        categoryId:
          Number(form.categoryId),

        brandId:
          form.brandId
            ? Number(form.brandId)
            : null,
      };

      if (editingId) {
        await productService.update(
          editingId,
          payload
        );

        setSuccess(
          "Product updated successfully."
        );
      } else {
        const created =
          await productService.create(
            payload
          );

        const newProductId =
          created?.id;

        if (!newProductId) {
          throw new Error(
            "Product was created but product ID was not returned."
          );
        }

        setEditingId(
          newProductId
        );

        setSuccess(
          "Product created successfully. You can now upload images and add variants."
        );
      }

      await loadData();

      // Keep modal open
    } catch (err: any) {
      console.error(
        "PRODUCT SAVE ERROR:",
        err
      );

      let message =
        err?.response?.data?.message;

      if (!message) {
        if (
          typeof err?.response?.data ===
          "string"
        ) {
          message =
            err.response.data;
        }
      }

      setError(
        message ||
          err?.message ||
          "Failed to save product."
      );
    } finally {
      setSaving(false);
    }
  };


  // ============================================================
  // SELECT MULTIPLE IMAGE FILES
  // ============================================================

  const handleImageSelection = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files =
      Array.from(
        event.target.files || []
      );

    if (!files.length) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const invalidFile =
      files.find(
        (file) =>
          !allowedTypes.includes(
            file.type
          )
      );

    if (invalidFile) {
      setError(
        "Only JPG, PNG and WEBP images are allowed."
      );
      return;
    }

    const largeFile =
      files.find(
        (file) =>
          file.size >
          10 * 1024 * 1024
      );

    if (largeFile) {
      setError(
        "Each image must be 10 MB or smaller."
      );
      return;
    }

    setError("");

    setSelectedFiles(
      files
    );
  };


// ============================================================
// UPLOAD MULTIPLE IMAGES
// ============================================================

const uploadImages = async () => {
  if (!editingId) {
    setError(
      "Please save the product first."
    );
    return;
  }

  if (!selectedFiles.length) {
    setError(
      "Please select one or more images."
    );
    return;
  }

  try {
    setUploading(true);
    setError("");
    setSuccess("");

    const startingCount =
      images.length;

    const uploadedImages: ProductImage[] = [];

    for (
      let index = 0;
      index < selectedFiles.length;
      index++
    ) {
      const file =
        selectedFiles[index];

      // =====================================================
      // UPLOAD + SAVE TO ProductImages
      // Backend:
      // POST /api/products/{productId}/images/upload
      // =====================================================

      const uploadedImage =
        await productService.uploadImage(
          editingId,
          file,
          form.name,
          startingCount === 0 && index === 0,
          startingCount + index
        );

      if (!uploadedImage) {
        throw new Error(
          `Failed to upload ${file.name}.`
        );
      }

      uploadedImages.push(
        uploadedImage
      );
    }

    // =====================================================
    // UPDATE LOCAL IMAGE LIST
    // =====================================================

    setImages(
      (previous) => [
        ...previous,
        ...uploadedImages,
      ]
    );

    setSelectedFiles([]);

    // Reset file input
    const input =
      document.getElementById(
        "product-image-input"
      ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }

    setSuccess(
      `${uploadedImages.length} image${
        uploadedImages.length > 1
          ? "s"
          : ""
      } uploaded successfully.`
    );
  } catch (err: any) {
    console.error(
      "IMAGE UPLOAD ERROR:",
      err
    );

    setError(
      err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Image upload failed."
    );
  } finally {
    setUploading(false);
  }
};
  // ============================================================
  // SET PRIMARY IMAGE
  // ============================================================

  const setPrimaryImage = async (
    image: ProductImage
  ) => {
    if (!editingId) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      // Update selected image as primary
      const updated =
        await productService.updateImage(
          editingId,
          image.id,
          {
            imageUrl:
              image.imageUrl,

            altText:
              image.altText,

            isPrimary: true,

            sortOrder:
              image.sortOrder,
          }
        );

      // Update all local images
      setImages(
        (previous) =>
          previous.map(
            (item) => ({
              ...item,
              isPrimary:
                item.id === updated.id,
            })
          )
      );

      setSuccess(
        "Primary image updated."
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to set primary image."
      );
    }
  };


  // ============================================================
  // DELETE IMAGE
  // ============================================================

  const deleteImage = async (
    imageId: number
  ) => {
    if (!editingId) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this image?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await productService.deleteImage(
        editingId,
        imageId
      );

      setImages(
        (previous) =>
          previous.filter(
            (image) =>
              image.id !== imageId
          )
      );

      setSuccess(
        "Image deleted successfully."
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete image."
      );
    }
  };


  // ============================================================
  // ADD VARIANT
  // ============================================================

  const addVariant = async () => {
    if (!editingId) {
      setError(
        "Please save the product first."
      );
      return;
    }

    if (!variant.name.trim()) {
      setError(
        "Variant name is required."
      );
      return;
    }

    try {
      setError("");
      setSuccess("");

      const created =
        await productService.createVariant(
          editingId,
          {
            name:
              variant.name.trim(),

            sku:
              variant.sku.trim()
                ? variant.sku.trim()
                : null,

            price:
              variant.price.trim()
                ? Number(
                    variant.price
                  )
                : null,

            discountPrice:
              variant.discountPrice.trim()
                ? Number(
                    variant.discountPrice
                  )
                : null,

            trackInventory:
              variant.trackInventory,

            isActive:
              variant.isActive,

            sortOrder:
              Number(
                variant.sortOrder
              ),
          }
        );

      setVariants(
        (previous) => [
          ...previous,
          created,
        ]
      );

      setVariant({
        ...emptyVariant,
        sortOrder:
          variants.length + 2,
      });

      setSuccess(
        "Variant added successfully."
      );
    } catch (err: any) {
      console.error(
        "VARIANT ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to add variant."
      );
    }
  };


  // ============================================================
  // DELETE VARIANT
  // ============================================================

  const deleteVariant = async (
    variantId: number
  ) => {
    if (!editingId) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this variant?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await productService.deleteVariant(
        editingId,
        variantId
      );

      setVariants(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== variantId
          )
      );

      setSuccess(
        "Variant deleted successfully."
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete variant."
      );
    }
  };


  // ============================================================
  // DELETE PRODUCT
  // ============================================================

  const deleteProduct = async (
    id: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this product?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      // IMPORTANT:
      // productService has remove(), not delete()
      await productService.remove(
        id
      );

      setProducts(
        (previous) =>
          previous.filter(
            (product) =>
              product.id !== id
          )
      );

      setSuccess(
        "Product deleted successfully."
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete product."
      );
    }
  };


  // ============================================================
  // FILTER PRODUCTS
  // ============================================================

  const filteredProducts =
    products.filter(
      (product) => {
        const keyword =
          search
            .trim()
            .toLowerCase();

        if (!keyword) {
          return true;
        }

        return (
          product.name
            .toLowerCase()
            .includes(keyword) ||
          product.sku
            .toLowerCase()
            .includes(keyword)
        );
      }
    );


  // ============================================================
  // IMAGE URL
  // ============================================================

  const getImageUrl = (
    imageUrl: string
  ) => {
    if (!imageUrl) {
      return "";
    }

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }

    return `https://localhost:7090${
      imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`
    }`;
  };

  // ============================================================
  // GET PRIMARY PRODUCT IMAGE
  // ============================================================

  const getPrimaryProductImage = (
    product: Product
  ): ProductImage | null => {
    if (
      !Array.isArray(product.images) ||
      product.images.length === 0
    ) {
      return null;
    }

    // Prefer the image marked as Primary.
    const primaryImage =
      product.images.find(
        (image) => image.isPrimary
      );

    // If no primary image exists, use the first available image.
    return (
      primaryImage ||
      product.images[0] ||
      null
    );
  };


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[#f5f7fa]">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="border-b bg-white">

        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-6">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff6b00] text-white">
              <ImageIcon size={23} />
            </div>

            <div>

              <h1 className="text-2xl font-bold text-slate-900">
                Product Management
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage products, images, variants and product settings.
              </p>

            </div>

          </div>


          <div className="flex gap-3">

            <button
              type="button"
              onClick={loadData}
              className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>


            <button
              type="button"
              onClick={openCreate}
              className="flex h-11 items-center gap-2 rounded-lg bg-[#ff6b00] px-5 text-sm font-semibold text-white hover:bg-[#e95f00]"
            >
              <Plus size={18} />
              Add Product
            </button>

          </div>

        </div>

      </div>


      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="mx-auto max-w-[1400px] px-6 py-6">

        {error && !modalOpen && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}


        {success && !modalOpen && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
            {success}
          </div>
        )}


        {/* SEARCH */}

        <div className="mb-5 flex items-center justify-between">

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search product name or SKU..."
            className="h-11 w-96 rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#ff6b00]"
          />


          <span className="text-sm text-slate-500">
            {filteredProducts.length} products
          </span>

        </div>


        {/* TABLE */}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="grid grid-cols-[1fr_180px_130px_150px] border-b bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">

            <div>Product</div>

            <div>Category</div>

            <div>Status</div>

            <div className="text-right">
              Actions
            </div>

          </div>


          {loading ? (

            <div className="py-20 text-center text-sm text-slate-500">
              Loading products...
            </div>

          ) : filteredProducts.length === 0 ? (

            <div className="py-20 text-center">

              <ImageIcon
                size={40}
                className="mx-auto mb-3 text-slate-300"
              />

              <p className="font-medium text-slate-600">
                No products found.
              </p>

            </div>

          ) : (

            filteredProducts.map(
              (product) => (

                <div
                  key={
                    product.id
                  }
                  className="grid grid-cols-[1fr_180px_130px_150px] items-center border-b border-slate-100 px-5 py-4 last:border-0 hover:bg-slate-50"
                >

                  {/* PRODUCT */}

                  <div className="flex items-center gap-4">

                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-slate-100">

                      {(() => {
                        const primaryImage =
                          getPrimaryProductImage(
                            product
                          );

                        return primaryImage?.imageUrl ? (
                          <img
                            src={getImageUrl(
                              primaryImage.imageUrl
                            )}
                            alt={
                              primaryImage.altText ||
                              product.name
                            }
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <ImageIcon
                            size={22}
                            className="text-slate-300"
                          />
                        );
                      })()}

                    </div>


                    <div>

                      <div className="flex items-center gap-2">

                        <p className="font-semibold text-slate-800">
                          {
                            product.name
                          }
                        </p>

                        {product.isFeatured && (
                          <span className="rounded bg-orange-50 px-2 py-1 text-[9px] font-bold uppercase text-[#ff6b00]">
                            Featured
                          </span>
                        )}

                      </div>


                      <p className="mt-1 text-xs text-slate-400">
                        SKU:{" "}
                        {
                          product.sku
                        }
                      </p>


                      <div className="mt-1 flex items-center gap-2">

                        <p className="text-sm font-bold text-[#ff6b00]">
                          ৳
                          {
                            product.discountPrice ??
                            product.price
                          }
                        </p>

                        {product.discountPrice &&
                          product.price && (
                            <p className="text-xs text-slate-400 line-through">
                              ৳
                              {
                                product.price
                              }
                            </p>
                          )}

                      </div>

                    </div>

                  </div>


                  {/* CATEGORY */}

                  <div className="text-sm text-slate-600">
                    {
                      product.categoryName
                    }
                  </div>


                  {/* STATUS */}

                  <div>

                    {product.isActive ? (

                      <span className="flex items-center gap-2 text-sm text-green-600">

                        <span className="h-2 w-2 rounded-full bg-green-500" />

                        Active

                      </span>

                    ) : (

                      <span className="flex items-center gap-2 text-sm text-red-500">

                        <span className="h-2 w-2 rounded-full bg-red-500" />

                        Inactive

                      </span>

                    )}

                  </div>


                  {/* ACTION */}

                  <div className="flex justify-end gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        openEdit(
                          product
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-orange-50 hover:text-[#ff6b00]"
                      title="Edit Product"
                    >
                      <Pencil size={17} />
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        deleteProduct(
                          product.id
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                      title="Delete Product"
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>

                </div>

              )
            )

          )}

        </div>

      </div>


      {/* ======================================================
          QUICK CATEGORY / SUB CATEGORY MODAL
      ====================================================== */}

      {categoryModalOpen && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-5 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {categoryModalMode === "category"
                    ? "Add Category"
                    : "Add Sub Category"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {categoryModalMode === "category"
                    ? "Create a new Main Category."
                    : "Create a child category under any existing category."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCategoryModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>

            </div>

            <div className="space-y-4 p-6">

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="form-label">
                  {categoryModalMode === "category"
                    ? "Category Name *"
                    : "Sub Category Name *"}
                </label>

                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(event) =>
                    setNewCategoryName(
                      event.target.value
                    )
                  }
                  placeholder={
                    categoryModalMode === "category"
                      ? "Example: Gaming"
                      : "Example: Gaming Keyboard"
                  }
                  className="form-input"
                  autoFocus
                />
              </div>

              {categoryModalMode ===
                "subcategory" && (

                <div>
                  <label className="form-label">
                    Parent Category *
                  </label>

                  <select
                    value={
                      newCategoryParentId
                    }
                    onChange={(event) =>
                      setNewCategoryParentId(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="form-input"
                  >
                    <option value={0}>
                      Select Parent Category
                    </option>

                    {categoryOptions.map(
                      ({ category, depth }) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {getDepthLabel(
                            depth,
                            category.name
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="form-label">
                  Description
                </label>

                <textarea
                  value={
                    newCategoryDescription
                  }
                  onChange={(event) =>
                    setNewCategoryDescription(
                      event.target.value
                    )
                  }
                  placeholder="Optional"
                  rows={3}
                  className="form-input resize-none"
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">

              <button
                type="button"
                onClick={
                  closeCategoryModal
                }
                disabled={
                  creatingCategory
                }
                className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  createCategoryInline
                }
                disabled={
                  creatingCategory ||
                  !newCategoryName.trim() ||
                  (categoryModalMode ===
                    "subcategory" &&
                    !newCategoryParentId)
                }
                className="flex h-10 items-center gap-2 rounded-lg bg-[#ff6b00] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save size={15} />

                {creatingCategory
                  ? "Saving..."
                  : categoryModalMode ===
                    "category"
                  ? "Add Category"
                  : "Add Sub Category"}
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          PRODUCT MODAL
      ====================================================== */}

      {modalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-5 backdrop-blur-sm">

          <div className="flex max-h-[95vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">


            {/* HEADER */}

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  {editingId
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Manage product information, images and variants.
                </p>

              </div>


              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={
                saveProduct
              }
              className="overflow-y-auto"
            >

              <div className="space-y-8 p-6">


                {/* MESSAGES */}

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}


                {success && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                    {success}
                  </div>
                )}


                {/* =================================================
                    BASIC INFORMATION
                ================================================= */}

                <section>

                  <h3 className="mb-4 text-base font-bold text-slate-900">
                    Basic Information
                  </h3>


                  <div className="grid grid-cols-2 gap-5">


                    {/* NAME */}

                    <div className="col-span-2">

                      <label className="form-label">
                        Product Name *
                      </label>

                      <input
                        type="text"
                        value={
                          form.name
                        }
                        onChange={(event) =>
                          updateForm(
                            "name",
                            event.target.value
                          )
                        }
                        placeholder="Example: Gaming Keyboard"
                        className="form-input"
                      />

                    </div>


                    {/* CATEGORY / SUB CATEGORY */}

                    <div className="col-span-2">

                      <div className="mb-2 flex items-center justify-between">

                        <label className="form-label mb-0">
                          Category *
                        </label>

                        <div className="flex items-center gap-2">

                          <button
                            type="button"
                            onClick={
                              openAddCategory
                            }
                            className="flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-semibold text-[#ff6b00] hover:bg-orange-100"
                          >
                            <Plus size={13} />
                            Add Category
                          </button>

                          <button
                            type="button"
                            onClick={
                              openAddSubCategory
                            }
                            disabled={
                              activeCategories.length === 0
                            }
                            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus size={13} />
                            Add Sub Category
                          </button>

                        </div>

                      </div>

                      <select
                        value={
                          form.categoryId
                        }
                        onChange={(event) => {
                          const value =
                            Number(
                              event.target.value
                            );

                          updateForm(
                            "categoryId",
                            value
                          );
                        }}
                        className="form-input"
                      >

                        <option value={0}>
                          Select Category
                        </option>

                        {categoryOptions.map(
                          ({
                            category,
                            depth,
                            hasChildren,
                          }) => (
                            <option
                              key={category.id}
                              value={category.id}
                              disabled={hasChildren}
                            >
                              {getDepthLabel(
                                depth,
                                hasChildren
                                  ? `${category.name} — Main Category`
                                  : category.name
                              )}
                            </option>
                          )
                        )}

                      </select>

                      {selectedCategoryPath && (
                        <p className="mt-2 text-xs text-slate-400">
                          Selected Path:\{" "}
                          <span className="font-medium text-slate-600">
                            {selectedCategoryPath}
                          </span>
                        </p>
                      )}

                      <p className="mt-2 text-xs text-slate-400">
                        Categories with children are groups. Select the lowest-level category for the product.
                      </p>

                    </div>


                    {/* BRAND */}

                    <div>

                      <label className="form-label">
                        Brand
                      </label>

                      <select
                        value={
                          form.brandId ??
                          ""
                        }
                        onChange={(event) =>
                          updateForm(
                            "brandId",
                            event.target.value
                              ? Number(
                                  event.target.value
                                )
                              : null
                          )
                        }
                        className="form-input"
                      >

                        <option value="">
                          No Brand
                        </option>

                        {brands.map(
                          (brand) => (

                            <option
                              key={
                                brand.id
                              }
                              value={
                                brand.id
                              }
                            >
                              {
                                brand.name
                              }
                            </option>

                          )
                        )}

                      </select>

                    </div>


                    {/* PRICE */}

                    <div>

                      <label className="form-label">
                        Price *
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={
                          form.price
                        }
                        onChange={(event) =>
                          updateForm(
                            "price",
                            Number(
                              event.target.value
                            )
                          )
                        }
                        className="form-input"
                      />

                    </div>


                    {/* DISCOUNT */}

                    <div>

                      <label className="form-label">
                        Discount Price
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={
                          form.discountPrice ??
                          ""
                        }
                        onChange={(event) =>
                          updateForm(
                            "discountPrice",
                            event.target.value
                              ? Number(
                                  event.target.value
                                )
                              : null
                          )
                        }
                        placeholder="Optional"
                        className="form-input"
                      />

                    </div>


                    {/* WARRANTY */}

                    <div>

                      <label className="form-label">
                        Warranty
                      </label>

                      <input
                        type="text"
                        value={
                          form.warranty
                        }
                        onChange={(event) =>
                          updateForm(
                            "warranty",
                            event.target.value
                          )
                        }
                        placeholder="Example: 1 Year"
                        className="form-input"
                      />

                    </div>


                    {/* SORT */}

                    <div>

                      <label className="form-label">
                        Sort Order
                      </label>

                      <input
                        type="number"
                        value={
                          form.sortOrder
                        }
                        onChange={(event) =>
                          updateForm(
                            "sortOrder",
                            Number(
                              event.target.value
                            )
                          )
                        }
                        className="form-input"
                      />

                    </div>

                  </div>

                </section>


                {/* =================================================
                    SHORT DESCRIPTION
                ================================================= */}

                <RichEditor
                  title="Short Description"
                  editorRef={
                    shortDescriptionRef
                  }
                  value={
                    form.shortDescription
                  }
                  placeholder="Write short product description..."
                  onChange={(value) =>
                    updateForm(
                      "shortDescription",
                      value
                    )
                  }
                />


                {/* =================================================
                    DESCRIPTION
                ================================================= */}

                <RichEditor
                  title="Description"
                  editorRef={
                    descriptionRef
                  }
                  value={
                    form.description
                  }
                  placeholder="Write detailed product description..."
                  onChange={(value) =>
                    updateForm(
                      "description",
                      value
                    )
                  }
                />


                {/* =================================================
                    PRODUCT IMAGES
                ================================================= */}

                <section>

                  <div className="mb-4 flex items-start justify-between">

                    <div>

                      <h3 className="text-base font-bold text-slate-900">
                        Product Images
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Select multiple images. The server automatically generates the image path.
                      </p>

                    </div>

                  </div>


                  {!editingId && (

                    <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                      Save the product first. Then you can upload product images.
                    </div>

                  )}


                  {/* UPLOAD AREA */}

                  <div className="flex gap-3">

                    <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 hover:border-[#ff6b00]">

                      <Upload
                        size={18}
                        className="shrink-0 text-[#ff6b00]"
                      />

                      <span className="truncate text-sm text-slate-500">

                        {selectedFiles.length > 0
                          ? `${selectedFiles.length} image${
                              selectedFiles.length > 1
                                ? "s"
                                : ""
                            } selected`
                          : "Choose Product Images"}

                      </span>

                      <input
                        id="product-image-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        disabled={
                          !editingId ||
                          uploading
                        }
                        onChange={
                          handleImageSelection
                        }
                      />

                    </label>


                    <button
                      type="button"
                      disabled={
                        !editingId ||
                        selectedFiles.length === 0 ||
                        uploading
                      }
                      onClick={
                        uploadImages
                      }
                      className="flex h-12 items-center gap-2 rounded-lg bg-[#ff6b00] px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >

                      <Upload size={17} />

                      {uploading
                        ? "Uploading..."
                        : "Upload Images"}

                    </button>

                  </div>


                  {/* SELECTED FILES */}

                  {selectedFiles.length > 0 && (

                    <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3">

                      <p className="mb-2 text-xs font-semibold text-slate-600">
                        Selected files
                      </p>

                      <div className="space-y-1">

                        {selectedFiles.map(
                          (file, index) => (

                            <div
                              key={`${file.name}-${index}`}
                              className="flex items-center justify-between text-xs text-slate-500"
                            >

                              <span className="truncate">
                                {file.name}
                              </span>

                              <span className="ml-3 shrink-0">
                                {(
                                  file.size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{" "}
                                MB
                              </span>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}


                  {/* IMAGE GRID */}

                  {images.length > 0 ? (

                    <div className="mt-5 grid grid-cols-4 gap-4">

                      {images.map(
                        (image) => (

                          <div
                            key={
                              image.id
                            }
                            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                          >

                            <img
                              src={getImageUrl(
                                image.imageUrl
                              )}
                              alt={
                                image.altText ||
                                form.name
                              }
                              className="aspect-square w-full object-cover"
                            />


                            {/* PRIMARY */}

                            {image.isPrimary && (

                              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#ff6b00] px-2 py-1 text-[10px] font-bold text-white shadow">
                                <Check size={11} />
                                Primary
                              </span>

                            )}


                            {/* ACTIONS */}

                            <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 transition group-hover:translate-y-0">

                              {!image.isPrimary ? (

                                <button
                                  type="button"
                                  onClick={() =>
                                    setPrimaryImage(
                                      image
                                    )
                                  }
                                  className="flex items-center gap-1 rounded-md bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-700"
                                >
                                  <Star
                                    size={12}
                                  />
                                  Primary
                                </button>

                              ) : (

                                <span />

                              )}


                              <button
                                type="button"
                                onClick={() =>
                                  deleteImage(
                                    image.id
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-red-500"
                              >
                                <Trash2
                                  size={14}
                                />
                              </button>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  ) : (

                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">

                      <ImageIcon
                        size={40}
                        className="mx-auto mb-3 text-slate-300"
                      />

                      <p className="text-sm font-medium text-slate-500">
                        No product images uploaded.
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        You can upload multiple images at once.
                      </p>

                    </div>

                  )}

                </section>


                {/* =================================================
                    PRODUCT VARIANTS
                ================================================= */}

                <section>

                  <div className="mb-4">

                    <h3 className="text-base font-bold text-slate-900">
                      Product Variants
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Add size, color, version or configuration variants.
                    </p>

                  </div>


                  {!editingId && (

                    <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                      Save the product first. Then you can add variants.
                    </div>

                  )}


                  <div className="overflow-hidden rounded-xl border border-slate-200">

                    {/* ADD VARIANT */}

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4">

                      <input
                        type="text"
                        value={
                          variant.name
                        }
                        onChange={(event) =>
                          setVariant(
                            (previous) => ({
                              ...previous,
                              name:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Variant Name *"
                        className="form-input"
                        disabled={
                          !editingId
                        }
                      />


                      <input
                        type="text"
                        value={
                          variant.sku
                        }
                        onChange={(event) =>
                          setVariant(
                            (previous) => ({
                              ...previous,
                              sku:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="SKU (Optional)"
                        className="form-input"
                        disabled={
                          !editingId
                        }
                      />


                      <input
                        type="number"
                        min="0"
                        value={
                          variant.price
                        }
                        onChange={(event) =>
                          setVariant(
                            (previous) => ({
                              ...previous,
                              price:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Price"
                        className="form-input"
                        disabled={
                          !editingId
                        }
                      />


                      <input
                        type="number"
                        min="0"
                        value={
                          variant.discountPrice
                        }
                        onChange={(event) =>
                          setVariant(
                            (previous) => ({
                              ...previous,
                              discountPrice:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Discount Price"
                        className="form-input"
                        disabled={
                          !editingId
                        }
                      />


                      <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">

                        <input
                          type="checkbox"
                          checked={
                            variant.trackInventory
                          }
                          onChange={(event) =>
                            setVariant(
                              (previous) => ({
                                ...previous,
                                trackInventory:
                                  event.target.checked,
                              })
                            )
                          }
                          disabled={
                            !editingId
                          }
                          className="h-4 w-4 accent-[#ff6b00]"
                        />

                        Track Inventory

                      </label>


                      <button
                        type="button"
                        onClick={
                          addVariant
                        }
                        disabled={
                          !editingId
                        }
                        className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#ff6b00] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus
                          size={16}
                        />
                        Add Variant
                      </button>

                    </div>


                    {/* VARIANTS */}

                    {variants.length === 0 ? (

                      <div className="border-t px-5 py-8 text-center text-sm text-slate-400">
                        No variants added yet.
                      </div>

                    ) : (

                      <div>

                        {variants.map(
                          (item) => (

                            <div
                              key={
                                item.id
                              }
                              className="flex items-center justify-between border-t px-5 py-4"
                            >

                              <div>

                                <div className="flex items-center gap-2">

                                  <p className="font-semibold text-slate-800">
                                    {
                                      item.name
                                    }
                                  </p>

                                  {item.isActive && (

                                    <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-medium text-green-600">
                                      Active
                                    </span>

                                  )}

                                </div>


                                <p className="mt-1 text-xs text-slate-400">
                                  SKU:{" "}
                                  {
                                    item.sku ||
                                    "N/A"
                                  }
                                </p>

                              </div>


                              <div className="flex items-center gap-5">

                                <div className="text-right">

                                  <p className="font-bold text-slate-800">
                                    ৳
                                    {
                                      item.discountPrice ??
                                      item.price ??
                                      0
                                    }
                                  </p>

                                  {item.discountPrice &&
                                    item.price && (

                                      <p className="text-xs text-slate-400 line-through">
                                        ৳
                                        {
                                          item.price
                                        }
                                      </p>

                                    )}

                                </div>


                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteVariant(
                                      item.id
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                                  title="Delete Variant"
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>

                </section>


                {/* =================================================
                    PRODUCT SETTINGS
                ================================================= */}

                <section>

                  <h3 className="mb-4 text-base font-bold text-slate-900">
                    Product Settings
                  </h3>


                  <div className="grid grid-cols-2 gap-3">

                    <ProductToggle
                      icon={
                        <Star size={17} />
                      }
                      title="Featured Product"
                      checked={
                        form.isFeatured
                      }
                      onChange={(value) =>
                        updateForm(
                          "isFeatured",
                          value
                        )
                      }
                    />


                    <ProductToggle
                      icon={
                        <Trophy size={17} />
                      }
                      title="Best Seller"
                      checked={
                        form.isBestSeller
                      }
                      onChange={(value) =>
                        updateForm(
                          "isBestSeller",
                          value
                        )
                      }
                    />


                    <ProductToggle
                      icon={
                        <Sparkles size={17} />
                      }
                      title="New Arrival"
                      checked={
                        form.isNewArrival
                      }
                      onChange={(value) =>
                        updateForm(
                          "isNewArrival",
                          value
                        )
                      }
                    />


                    <ProductToggle
                      icon={
                        <Eye size={17} />
                      }
                      title="Active Product"
                      checked={
                        form.isActive
                      }
                      onChange={(value) =>
                        updateForm(
                          "isActive",
                          value
                        )
                      }
                    />

                  </div>

                </section>

              </div>


              {/* ==================================================
                  FOOTER
              ================================================== */}

              <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-slate-50 px-6 py-4">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  className="h-11 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={saving}
                  className="flex h-11 items-center gap-2 rounded-lg bg-[#ff6b00] px-6 text-sm font-semibold text-white disabled:opacity-50"
                >

                  <Save size={17} />

                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Product"
                    : "Create Product"}

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
// RICH TEXT EDITOR
// ============================================================

function RichEditor({
  title,
  editorRef,
  value,
  placeholder,
  onChange,
}: {
  title: string;
  editorRef: RefObject<HTMLDivElement | null>;
  value: string;
  placeholder: string;
  onChange: (
    value: string
  ) => void;
}) {

  const runCommand = (
    command: string
  ) => {
    const editor =
      editorRef.current;

    if (!editor) {
      return;
    }

    editor.focus();

    document.execCommand(
      command,
      false
    );

    onChange(
      editor.innerHTML
    );
  };


  const insertLink = () => {
    const editor =
      editorRef.current;

    if (!editor) {
      return;
    }

    editor.focus();

    const url =
      window.prompt(
        "Enter URL:"
      );

    if (!url) {
      return;
    }

    document.execCommand(
      "createLink",
      false,
      url
    );

    onChange(
      editor.innerHTML
    );
  };


  return (
    <section>

      <label className="form-label">
        {title}
      </label>


      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">


        {/* TOOLBAR */}

        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">

          <EditorButton
            title="Bold"
            onMouseDown={() =>
              runCommand(
                "bold"
              )
            }
          >
            <Bold size={15} />
          </EditorButton>


          <EditorButton
            title="Italic"
            onMouseDown={() =>
              runCommand(
                "italic"
              )
            }
          >
            <Italic size={15} />
          </EditorButton>


          <div className="mx-1 h-5 w-px bg-slate-300" />


          {/* BULLET */}

          <EditorButton
            title="Bullet List"
            onMouseDown={() =>
              runCommand(
                "insertUnorderedList"
              )
            }
          >
            <List size={16} />
          </EditorButton>


          {/* NUMBERED */}

          <EditorButton
            title="Numbered List"
            onMouseDown={() =>
              runCommand(
                "insertOrderedList"
              )
            }
          >
            <ListOrdered size={16} />
          </EditorButton>


          <div className="mx-1 h-5 w-px bg-slate-300" />


          {/* LINK */}

          <EditorButton
            title="Insert Link"
            onMouseDown={
              insertLink
            }
          >
            <Link size={15} />
          </EditorButton>

        </div>


        {/* EDITOR */}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(event) =>
            onChange(
              event.currentTarget
                .innerHTML
            )
          }
          dangerouslySetInnerHTML={{
            __html:
              value || "",
          }}
          data-placeholder={
            placeholder
          }
          className="rich-editor min-h-[120px] px-4 py-3 text-sm leading-6 text-slate-700 outline-none"
        />

      </div>

    </section>
  );
}


// ============================================================
// EDITOR BUTTON
// ============================================================

function EditorButton({
  children,
  title,
  onMouseDown,
}: {
  children: ReactNode;
  title: string;
  onMouseDown: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(event) => {
        event.preventDefault();
        onMouseDown();
      }}
      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-[#ff6b00]"
    >
      {children}
    </button>
  );
}


// ============================================================
// PRODUCT TOGGLE
// ============================================================

function ProductToggle({
  icon,
  title,
  checked,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  checked: boolean;
  onChange: (
    value: boolean
  ) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
        checked
          ? "border-orange-200 bg-orange-50"
          : "border-slate-200 bg-white"
      }`}
    >

      <div className="flex items-center gap-3">

        <span className="text-[#ff6b00]">
          {icon}
        </span>

        <span className="text-sm font-semibold text-slate-700">
          {title}
        </span>

      </div>


      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        className="h-4 w-4 accent-[#ff6b00]"
      />

    </label>
  );
}