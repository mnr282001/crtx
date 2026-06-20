"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { listCollections } from "../api";

export type Collection = { id: string; name: string };

type ContextValue = {
  collections: Collection[];
  activeId: string;
  setActiveId: (id: string) => void;
  refresh: () => Promise<void>;
};

const CollectionContext = createContext<ContextValue>({
  collections: [],
  activeId: "",
  setActiveId: () => {},
  refresh: async () => {},
});

export function CollectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeId, setActiveIdState] = useState("");

  const refresh = useCallback(async () => {
    try {
      const data = await listCollections();
      setCollections(data);
    } catch {}
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("crtx-collection");
    if (saved) setActiveIdState(saved);
    refresh();
  }, [refresh]);

  const setActiveId = (id: string) => {
    setActiveIdState(id);
    localStorage.setItem("crtx-collection", id);
  };

  return (
    <CollectionContext.Provider
      value={{ collections, activeId, setActiveId, refresh }}
    >
      {children}
    </CollectionContext.Provider>
  );
}

export const useCollections = () => useContext(CollectionContext);
