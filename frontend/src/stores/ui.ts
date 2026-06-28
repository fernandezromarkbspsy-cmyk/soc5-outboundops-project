import { create } from 'zustand';
interface UiState {sidebarOpen:boolean;soundEnabled:boolean;toggleSidebar:()=>void;toggleSound:()=>void}
export const useUiStore=create<UiState>((set)=>({sidebarOpen:false,soundEnabled:false,toggleSidebar:()=>set(s=>({sidebarOpen:!s.sidebarOpen})),toggleSound:()=>set(s=>({soundEnabled:!s.soundEnabled}))}));
