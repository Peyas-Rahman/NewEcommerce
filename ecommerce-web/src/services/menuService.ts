import axios from "axios";

import type {
  MenuItem,
  CreateMenuItem,
  UpdateMenuItem,
} from "../types/menu";


/* ============================================================
   API
============================================================ */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const menuApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

menuApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("dexora_customer_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


/* ============================================================
   HEADER MENU SETTINGS
============================================================ */

export interface HeaderMenuSetting {
  id: number;
  alignment: string;
  spacing: string;
  showAllCategories: boolean;
  showDeals: boolean;
  isSticky: boolean;
  isActive: boolean;
}


export interface UpdateHeaderMenuSetting {
  alignment: string;
  spacing: string;
  showAllCategories: boolean;
  showDeals: boolean;
  isSticky: boolean;
  isActive: boolean;
}


/* ============================================================
   GET ALL MENUS
============================================================ */

export const getAllMenus = async (): Promise<MenuItem[]> => {

  const response =
    await menuApi.get<MenuItem[]>("/menus");

  return response.data;
};


/* ============================================================
   GET HEADER MENU
============================================================ */

export const getHeaderMenu = async (): Promise<MenuItem[]> => {

  const response =
    await menuApi.get<MenuItem[]>("/menus/header");

  return response.data;
};


/* Alias */

export const getHeaderMenus = getHeaderMenu;


/* ============================================================
   GET HEADER MENU SETTINGS
============================================================ */

export const getHeaderMenuSettings =
  async (): Promise<HeaderMenuSetting> => {

    const response =
      await menuApi.get<HeaderMenuSetting>(
        "/menus/header/settings"
      );

    return response.data;
  };


/* ============================================================
   UPDATE HEADER MENU SETTINGS
============================================================ */

export const updateHeaderMenuSettings =
  async (
    data: UpdateHeaderMenuSetting
  ): Promise<HeaderMenuSetting> => {

    const response =
      await menuApi.put<HeaderMenuSetting>(
        "/menus/header/settings",
        data
      );

    return response.data;
  };


/* ============================================================
   GET MENU BY ID
============================================================ */

export const getMenuById = async (
  id: number
): Promise<MenuItem> => {

  const response =
    await menuApi.get<MenuItem>(
      `/menus/${id}`
    );

  return response.data;
};


/* ============================================================
   CREATE MENU
============================================================ */

export const createMenu = async (
  data: CreateMenuItem
): Promise<MenuItem> => {

  const response =
    await menuApi.post<MenuItem>(
      "/menus",
      data
    );

  return response.data;
};


/* ============================================================
   UPDATE MENU
============================================================ */

export const updateMenu = async (
  id: number,
  data: UpdateMenuItem
): Promise<MenuItem> => {

  const response =
    await menuApi.put<MenuItem>(
      `/menus/${id}`,
      data
    );

  return response.data;
};


/* ============================================================
   DELETE MENU
============================================================ */

export const deleteMenu = async (
  id: number
): Promise<void> => {

  await menuApi.delete(
    `/menus/${id}`
  );

};