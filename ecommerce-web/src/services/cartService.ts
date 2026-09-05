import axios from "axios";
const API=import.meta.env.VITE_API_BASE_URL||"/api";
const api=axios.create({baseURL:API,headers:{"Content-Type":"application/json"}});
api.interceptors.request.use(c=>{const t=localStorage.getItem("dexora_customer_token");if(t)c.headers.Authorization=`Bearer ${t}`;return c;});
export interface CartItem{id:number;productId:number;productVariantId?:number|null;productName:string;variantName?:string|null;sku:string;unitPrice:number;quantity:number;totalPrice:number;imageUrl?:string|null}
export interface Cart{id:number;customerId?:number|null;guestToken?:string|null;totalItems:number;subTotal:number;items:CartItem[]}
export function guestToken(){let t=localStorage.getItem("dexora_guest_token");if(!t){t=crypto.randomUUID();localStorage.setItem("dexora_guest_token",t)}return t}
function customerId(){const token=localStorage.getItem("dexora_customer_token");const v=localStorage.getItem("dexora_customer_id");return token&&v?Number(v):undefined}
const qs=()=>({customerId:customerId(),guestToken:customerId()?undefined:guestToken()});
function rememberGuestCart(cart:Cart){if(!customerId()&&cart.guestToken)localStorage.setItem("dexora_guest_token",cart.guestToken);return cart}
export async function getCart(){return rememberGuestCart((await api.get<Cart>("/carts",{params:qs()})).data)}
export async function addItem(productId:number,productVariantId:number|undefined,quantity:number){const cart=rememberGuestCart((await api.post<Cart>("/carts/items",{productId,productVariantId,quantity},{params:qs()})).data);window.dispatchEvent(new CustomEvent("dexora-cart-updated"));return cart}
export async function updateItem(cartId:number,itemId:number,quantity:number){const cart=(await api.put<Cart>(`/carts/${cartId}/items/${itemId}`,{quantity})).data;window.dispatchEvent(new CustomEvent("dexora-cart-updated"));return cart}
export async function removeItem(cartId:number,itemId:number){const result=(await api.delete(`/carts/${cartId}/items/${itemId}`)).data;window.dispatchEvent(new CustomEvent("dexora-cart-updated"));return result}
export async function clearCart(cartId:number){return (await api.delete(`/carts/${cartId}`)).data}
export default {getCart,addItem,updateItem,removeItem,clearCart};
