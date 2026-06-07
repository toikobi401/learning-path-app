import { create } from "zustand";

type UserState = {
  name: string | null;
  avatarUrl: string | null;
  setUser: (data: { name?: string | null; avatarUrl?: string | null }) => void;
};

export const useUserStore = create<UserState>((set) => ({
  name: null,
  avatarUrl: null,
  setUser: (data) =>
    set((s) => ({
      name: data.name !== undefined ? data.name : s.name,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : s.avatarUrl,
    })),
}));
