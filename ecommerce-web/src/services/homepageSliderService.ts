import axios from "axios";

export interface HomepageSlider {
  id: number;
  imageUrl: string;
  badge: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  sortOrder: number;
  isActive: boolean;
}

export type HomepageSliderInput = Omit<HomepageSlider, "id">;
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "/api" });

export async function getHomepageSliders(activeOnly = false) {
  const response = await api.get<HomepageSlider[]>("/homepage-sliders", { params: { activeOnly } });
  return response.data;
}
export async function createHomepageSlider(data: HomepageSliderInput) { return (await api.post<HomepageSlider>("/homepage-sliders", data)).data; }
export async function updateHomepageSlider(id: number, data: HomepageSliderInput) { return (await api.put<HomepageSlider>(`/homepage-sliders/${id}`, data)).data; }
export async function deleteHomepageSlider(id: number) { await api.delete(`/homepage-sliders/${id}`); }
