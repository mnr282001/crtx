"use client";

import { createContext, useContext, useState } from "react";

type Tab = "chat" | "docs" | "eval";

const TabCtx = createContext<{ tab: Tab; setTab: (t: Tab) => void }>({
  tab: "chat",
  setTab: () => {},
});

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>("chat");
  return <TabCtx.Provider value={{ tab, setTab }}>{children}</TabCtx.Provider>;
}

export function useTab() {
  return useContext(TabCtx);
}
