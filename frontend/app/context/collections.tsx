"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { listCollections, getCollectionConfig, updateCollectionConfig } from "../api";
import {
  DEFAULT_PIPELINE_CONFIG,
  type PipelineConfigValue,
} from "../components/PipelineConfig";

export type Collection = { id: string; name: string };

type ContextValue = {
  collections: Collection[];
  activeId: string;
  setActiveId: (id: string) => void;
  refresh: () => Promise<void>;
  pipelineConfig: PipelineConfigValue;
  savePipelineConfig: (config: PipelineConfigValue) => Promise<void>;
  configSaving: boolean;
};

const CollectionContext = createContext<ContextValue>({
  collections: [],
  activeId: "",
  setActiveId: () => {},
  refresh: async () => {},
  pipelineConfig: DEFAULT_PIPELINE_CONFIG,
  savePipelineConfig: async () => {},
  configSaving: false,
});

export function CollectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeId, setActiveIdState] = useState("");
  const [pipelineConfig, setPipelineConfig] = useState<PipelineConfigValue>(DEFAULT_PIPELINE_CONFIG);
  const [configSaving, setConfigSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await listCollections();
      setCollections(data);
    } catch {}
  }, []);

  const fetchConfig = useCallback(async (id: string) => {
    if (!id) {
      setPipelineConfig(DEFAULT_PIPELINE_CONFIG);
      return;
    }
    try {
      const cfg = await getCollectionConfig(id);
      setPipelineConfig(cfg);
    } catch {
      setPipelineConfig(DEFAULT_PIPELINE_CONFIG);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("crtx-collection");
    if (saved) {
      setActiveIdState(saved);
      fetchConfig(saved);
    }
    refresh();
  }, [refresh, fetchConfig]);

  const setActiveId = (id: string) => {
    setActiveIdState(id);
    localStorage.setItem("crtx-collection", id);
    fetchConfig(id);
  };

  const savePipelineConfig = async (config: PipelineConfigValue) => {
    setPipelineConfig(config);
    if (!activeId) return;
    setConfigSaving(true);
    try {
      await updateCollectionConfig(activeId, config);
    } finally {
      setConfigSaving(false);
    }
  };

  return (
    <CollectionContext.Provider
      value={{
        collections,
        activeId,
        setActiveId,
        refresh,
        pipelineConfig,
        savePipelineConfig,
        configSaving,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
}

export const useCollections = () => useContext(CollectionContext);
