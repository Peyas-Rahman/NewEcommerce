const WISHLIST_KEY = "dexora_guest_wishlist";
const COMPARE_KEY = "dexora_compare_products";

function read(key: string): number[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((id) => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

function write(key: string, ids: number[]) {
  localStorage.setItem(key, JSON.stringify([...new Set(ids)]));
  window.dispatchEvent(new CustomEvent("dexora-shopping-list-updated"));
}

export const wishlistIds = () => read(WISHLIST_KEY);
export const compareIds = () => read(COMPARE_KEY);
export const toggleWishlist = (id: number) => {
  const ids = wishlistIds();
  write(WISHLIST_KEY, ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
};
export const toggleCompare = (id: number) => {
  const ids = compareIds();
  if (!ids.includes(id) && ids.length >= 4) throw new Error("You can compare up to four products.");
  write(COMPARE_KEY, ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
};
export const removeWishlist = (id: number) => write(WISHLIST_KEY, wishlistIds().filter((item) => item !== id));
export const removeCompare = (id: number) => write(COMPARE_KEY, compareIds().filter((item) => item !== id));
export const clearShoppingLists = () => {
  localStorage.removeItem(WISHLIST_KEY);
  localStorage.removeItem(COMPARE_KEY);
  window.dispatchEvent(new CustomEvent("dexora-shopping-list-updated"));
};