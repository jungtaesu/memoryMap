import React, { createContext, useContext, useMemo, useState } from "react";

export type Pin = {
  id: string;
  lat: number;
  lng: number;
  createdAt: number;
  memo?: string;
  photoUri?: string; // 다음 단계(사진) 대비
};

type PinsContextValue = {
  pins: Pin[];
  addPin: (pin: Pin) => void;
  updatePin: (id: string, patch: Partial<Pin>) => void;
  clearPins: () => void;
  getPin: (id: string) => Pin | undefined;
};

const PinsContext = createContext<PinsContextValue | null>(null);

export function PinsProvider({ children }: { children: React.ReactNode }) {
  const [pins, setPins] = useState<Pin[]>([]);

  const addPin = (pin: Pin) => {
    setPins((prev) => [pin, ...prev]);
  };

  const updatePin = (id: string, patch: Partial<Pin>) => {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const clearPins = () => setPins([]);

  const getPin = (id: string) => pins.find((p) => p.id === id);

  const value = useMemo(
    () => ({ pins, addPin, updatePin, clearPins, getPin }),
    [pins]
  );

  return <PinsContext.Provider value={value}>{children}</PinsContext.Provider>;
}

export function usePins() {
  const ctx = useContext(PinsContext);
  if (!ctx) throw new Error("usePins must be used within PinsProvider");
  return ctx;
}
