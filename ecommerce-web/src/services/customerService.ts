import axios from "axios";
import { clearShoppingLists } from "./shoppingListService";

const API = import.meta.env.VITE_API_BASE_URL || "/api";
const api = axios.create({ baseURL: API, headers: { "Content-Type": "application/json" } });
api.interceptors.request.use(config => { const token=localStorage.getItem("dexora_customer_token"); if(token) config.headers.Authorization=`Bearer ${token}`; return config; });

export interface CustomerProfile { id:number; firstName:string; lastName?:string|null; email?:string|null; phone?:string|null; isEmailVerified?:boolean; isPhoneVerified?:boolean; isTwoFactorEnabled?:boolean; isActive?:boolean; createdAt:string; }
export interface Address { id:number; addressType:string; fullName:string; phone:string; addressLine:string; city?:string|null; area?:string|null; postalCode?:string|null; isDefault:boolean; }
export interface WishlistItem { id:number; productId:number; productName:string; imageUrl?:string|null; price:number; createdAt:string; }
export interface AuthResponse { customerId:number; firstName:string; lastName?:string|null; email?:string|null; phone?:string|null; token:string; isTwoFactorRequired:boolean; }
const unwrap=<T,>(d:any):T => d?.data ?? d?.item ?? d;

export async function login(login:string,password:string){ const r=await api.post<AuthResponse>("/customers/login",{login,password}); const d=r.data; localStorage.setItem("dexora_customer_token",d.token); localStorage.setItem("dexora_customer_id",String(d.customerId)); localStorage.setItem("dexora_customer_name",`${d.firstName} ${d.lastName||""}`.trim()); return d; }
export async function mergeGuestCart(){ const token=localStorage.getItem("dexora_guest_token"); if(token && isLoggedIn()) await api.post("/carts/merge",null,{params:{guestToken:token}}); }
export async function register(data:{firstName:string;lastName?:string;email?:string;phone?:string;password:string}){ return (await api.post<AuthResponse>("/customers/register",data)).data; }
export async function getProfile(){ return unwrap<CustomerProfile>((await api.get("/customers/me/profile")).data); }
export async function getOrders<T=any[]>(){ const d=(await api.get("/customers/me/orders")).data; return (Array.isArray(d)?d:d?.items||d?.data||[]) as T; }
export async function getOrder<T=any>(id:number){ return unwrap<T>((await api.get(`/customers/me/orders/${id}`)).data); }
export async function getAddresses(){ const d=(await api.get("/customers/me/addresses")).data; return (Array.isArray(d)?d:d?.items||d?.data||[]) as Address[]; }
export async function createAddress(data:Omit<Address,"id">){ return unwrap<Address>((await api.post("/customers/me/addresses",data)).data); }
export async function updateAddress(id:number,data:Omit<Address,"id">){ return unwrap<Address>((await api.put(`/customers/me/addresses/${id}`,data)).data); }
export async function deleteAddress(id:number){ await api.delete(`/customers/me/addresses/${id}`); }
export async function getWishlist(){ const d=(await api.get("/customers/me/wishlist")).data; return (Array.isArray(d)?d:d?.items||d?.data||[]) as WishlistItem[]; }
export async function addWishlist(productId:number){ return unwrap<WishlistItem>((await api.post(`/customers/me/wishlist/${productId}`)).data); }
export async function removeWishlist(productId:number){ await api.delete(`/customers/me/wishlist/${productId}`); }
export function logout(){ localStorage.removeItem("dexora_customer_token"); localStorage.removeItem("dexora_customer_id"); localStorage.removeItem("dexora_customer_name"); clearShoppingLists(); }
export function isLoggedIn(){ return !!localStorage.getItem("dexora_customer_token"); }
export default {login,mergeGuestCart,register,getProfile,getOrders,getOrder,getAddresses,createAddress,updateAddress,deleteAddress,getWishlist,addWishlist,removeWishlist,logout,isLoggedIn};
