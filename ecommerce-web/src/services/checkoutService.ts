import axios from "axios";
import { guestToken } from "./cartService";
const API=import.meta.env.VITE_API_BASE_URL||"/api";
const api=axios.create({baseURL:API,headers:{"Content-Type":"application/json"}});
api.interceptors.request.use(config=>{const token=localStorage.getItem("dexora_customer_token");if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
export interface CheckoutPayload { customerId?:number|null; guestName?:string; guestPhone?:string; guestEmail?:string; guestToken?:string; shippingName:string; shippingPhone:string; shippingAddress:string; shippingCity?:string; shippingArea?:string; shippingPostalCode?:string; paymentMethod:string; customerNote?:string; }
export async function checkout(data:CheckoutPayload){ const token=localStorage.getItem("dexora_customer_token"); const customerId=token?localStorage.getItem("dexora_customer_id"):null; return (await api.post("/checkout",{...data,customerId:customerId?Number(customerId):null,guestToken:customerId?undefined:guestToken()})).data; }
