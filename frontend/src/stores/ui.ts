import { create } from 'zustand';
interface UiState {sidebarOpen:boolean;soundEnabled:boolean;search:string;setSearch:(search:string)=>void;toggleSidebar:()=>void;toggleSound:()=>void}
export const useUiStore=create<UiState>((set)=>({sidebarOpen:false,soundEnabled:false,search:'',setSearch:(search)=>set({search}),toggleSidebar:()=>set(s=>({sidebarOpen:!s.sidebarOpen})),toggleSound:()=>set(s=>({soundEnabled:!s.soundEnabled}))}));
