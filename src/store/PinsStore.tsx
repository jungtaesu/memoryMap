import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initDb, fetchPins, insertPin, updatePinRow, deleteAllPins, PinRow, fetchAllPhotos, insertPhoto, deletePhoto } from "../db/db";

export type Pin = {
  id: string;
  lat: number;
  lng: number;
  createdAt: number;
  memo?: string;
  photos: string[]; // 1:N 관계
  region1?: string; // 시/도
  region2?: string; // 시/군/구
  region3?: string; // 동/읍/면
  formattedAddress?: string; // 풀 주소(옵션)
};

type PinsContextValue = {
  pins: Pin[];
  isReady: boolean;
  addPin: (pin: Pin) => Promise<void>;
  updatePin: (id: string, patch: Partial<Pin>) => Promise<void>;
  addPinPhoto: (pinId: string, uri: string) => Promise<void>;
  deletePinPhoto: (pinId: string, uri: string) => Promise<void>;
  clearPins: () => Promise<void>;
  reloadPins: () => Promise<void>;
  getPin: (id: string) => Pin | undefined;
};

const PinsContext = createContext<PinsContextValue | null>(null);

function rowToPin(r: PinRow, photos: string[] = []): Pin {
  return {
    id: r.id,
    lat: r.lat,
    lng: r.lng,
    createdAt: r.createdAt,
    memo: r.memo ?? "",
    photos,
    region1: r.region1 ?? undefined,
    region2: r.region2 ?? undefined,
    region3: r.region3 ?? undefined,
    formattedAddress: r.formattedAddress ?? undefined,
  };
}

function pinToRow(p: Pin): PinRow {
  return {
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    createdAt: p.createdAt,
    memo: p.memo ?? "",
    photoUri: null, // 이제 사용 안함
    region1: p.region1 ?? null,
    region2: p.region2 ?? null,
    region3: p.region3 ?? null,
    formattedAddress: p.formattedAddress ?? null,
  };
}

export function PinsProvider({ children }: { children: React.ReactNode }) {
  const [pins, setPins] = useState<Pin[]>([]);
  const [isReady, setIsReady] = useState(false);

  const loadFromDb = async () => {
    try {
      await initDb();
      const rows = await fetchPins();
      const photos = await fetchAllPhotos();

      // pinId별로 사진 그룹화
      const photoMap: Record<string, string[]> = {};
      photos.forEach((p) => {
        if (!photoMap[p.pinId]) photoMap[p.pinId] = [];
        photoMap[p.pinId].push(p.uri);
      });

      setPins(rows.map((r) => rowToPin(r, photoMap[r.id] || [])));
      setIsReady(true);
    } catch (e) {
      console.log("DB init/load failed:", e);
      setIsReady(true);
    }
  };

  useEffect(() => {
    loadFromDb();
  }, []);

  const reloadPins = async () => {
    await loadFromDb();
  };


  
  const addPin = async (pin: Pin) => {
    setPins((prev) => [pin, ...prev]);
    await insertPin(pinToRow(pin));
  };

  const updatePin = async (id: string, patch: Partial<Pin>) => {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

    // DB patch 변환
    const dbPatch: Partial<PinRow> = {};
    if (patch.memo !== undefined) dbPatch.memo = patch.memo;
    // photoUri is deprecated in Pin type, so we don't update it here.
    if (patch.lat !== undefined) dbPatch.lat = patch.lat;
    if (patch.lng !== undefined) dbPatch.lng = patch.lng;
    if (patch.createdAt !== undefined) dbPatch.createdAt = patch.createdAt;
    
    // 추가된 주소 필드 매핑
    if (patch.region1 !== undefined) dbPatch.region1 = patch.region1 ?? null;
    if (patch.region2 !== undefined) dbPatch.region2 = patch.region2 ?? null;
    if (patch.region3 !== undefined) dbPatch.region3 = patch.region3 ?? null;
    if (patch.formattedAddress !== undefined) dbPatch.formattedAddress = patch.formattedAddress ?? null;

    await updatePinRow(id, dbPatch);
  };

  const addPinPhoto = async (pinId: string, uri: string) => {
    setPins((prev) =>
      prev.map((p) =>
        p.id === pinId ? { ...p, photos: [...p.photos, uri] } : p
      )
    );
    await insertPhoto(pinId, uri);
  };

  const deletePinPhoto = async (pinId: string, uri: string) => {
    setPins((prev) =>
      prev.map((p) =>
        p.id === pinId
          ? { ...p, photos: p.photos.filter((u) => u !== uri) }
          : p
      )
    );
    await deletePhoto(uri);
  };

  const clearPins = async () => {
    setPins([]);
    await deleteAllPins();
  };

  const getPin = (id: string) => pins.find((p) => p.id === id);

  const value = useMemo(
    () => ({ pins, isReady, addPin, updatePin, addPinPhoto, deletePinPhoto, clearPins, reloadPins, getPin }),
    [pins, isReady]
  );

  return <PinsContext.Provider value={value}>{children}</PinsContext.Provider>;
}

export function usePins() {
  const ctx = useContext(PinsContext);
  if (!ctx) throw new Error("usePins must be used within PinsProvider");
  return ctx;
}
