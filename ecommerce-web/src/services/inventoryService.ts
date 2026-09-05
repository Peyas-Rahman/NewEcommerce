import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const api = axios.create({ baseURL: API_BASE_URL, headers: { "Content-Type": "application/json" } });

export interface Inventory { id:number; productVariantId:number; stockQuantity:number; reservedQuantity:number; availableQuantity:number; reorderLevel:number; isActive:boolean; }
export interface InventoryPayload { stockQuantity:number; reservedQuantity:number; reorderLevel:number; isActive:boolean; }
export interface AdjustmentPayload { quantity:number; transactionType:string; referenceType?:string|null; referenceId?:string|null; note?:string|null; }
export interface ReserveReleasePayload { quantity:number; referenceType?:string|null; referenceId?:string|null; note?:string|null; }
export interface InventoryTransaction { id:number; inventoryId:number; quantity:number; quantityBefore:number; quantityAfter:number; transactionType:string; referenceType?:string|null; referenceId?:string|null; note?:string|null; createdAt:string; }

export async function getInventory(productId:number, variantId:number):Promise<Inventory|null>{
  try { return (await api.get(`/products/${productId}/variants/${variantId}/inventory`)).data ?? null; }
  catch(e:any){ if(e?.response?.status===404)return null; throw e; }
}
export async function createInventory(productId:number, variantId:number, data:InventoryPayload){ return (await api.post(`/products/${productId}/variants/${variantId}/inventory`,data)).data; }
export async function updateInventory(productId:number, variantId:number, data:InventoryPayload){ return (await api.put(`/products/${productId}/variants/${variantId}/inventory`,data)).data; }
export async function adjustStock(productId:number, variantId:number, data:AdjustmentPayload){ return (await api.post(`/products/${productId}/variants/${variantId}/inventory/adjust`,data)).data; }
export async function reserveStock(productId:number, variantId:number, data:ReserveReleasePayload){ return (await api.post(`/products/${productId}/variants/${variantId}/inventory/reserve`,data)).data; }
export async function releaseStock(productId:number, variantId:number, data:ReserveReleasePayload){ return (await api.post(`/products/${productId}/variants/${variantId}/inventory/release`,data)).data; }
export async function getTransactions(productId:number, variantId:number):Promise<InventoryTransaction[]>{
  const data=(await api.get(`/products/${productId}/variants/${variantId}/inventory/transactions`)).data;
  if(Array.isArray(data))return data; if(Array.isArray(data?.items))return data.items; if(Array.isArray(data?.data))return data.data; if(Array.isArray(data?.results))return data.results; return [];
}
export default {getInventory,createInventory,updateInventory,adjustStock,reserveStock,releaseStock,getTransactions};
