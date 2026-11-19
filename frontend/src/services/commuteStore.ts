export interface SavedCommuteAnchor {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address?: string;
  road_distance_km?: number;
  straight_line_distance_km?: number;
  estimated_duration_mins?: number;
  tortuosity_ratio?: number;
  route_geometry?: [number, number][];
}

const STORAGE_KEY = 'hi_in_saved_commute_destinations';

export const DEFAULT_ANCHORS: SavedCommuteAnchor[] = [
  { id: '1', name: 'Rushikonda IT SEZ', type: 'Workplace', lat: 17.8180, lng: 83.3850 },
  { id: '2', name: 'Visakhapatnam Airport', type: 'Transit Hub', lat: 17.7215, lng: 83.2245 },
  { id: '3', name: 'Visakhapatnam Railway Station', type: 'Transit Hub', lat: 17.7210, lng: 83.2965 }
];

export const getSavedCommutes = (): SavedCommuteAnchor[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ANCHORS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_ANCHORS;
  } catch (e) {
    console.error('Failed to read saved commutes:', e);
    return DEFAULT_ANCHORS;
  }
};

export const saveCustomCommute = (anchor: Omit<SavedCommuteAnchor, 'id'> & { id?: string }): SavedCommuteAnchor[] => {
  const current = getSavedCommutes();
  const exists = current.find(
    (c) => c.name.toLowerCase() === anchor.name.toLowerCase() ||
           (Math.abs(c.lat - anchor.lat) < 0.001 && Math.abs(c.lng - anchor.lng) < 0.001)
  );

  let updated: SavedCommuteAnchor[];
  if (exists) {
    updated = current.map((c) =>
      c.id === exists.id ? { ...c, ...anchor, id: exists.id } : c
    );
  } else {
    const newAnchor: SavedCommuteAnchor = {
      ...anchor,
      id: anchor.id || Date.now().toString()
    };
    updated = [newAnchor, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('commutes-updated'));
  } catch (e) {
    console.error('Failed to save commute destination:', e);
  }

  return updated;
};

export const removeCustomCommute = (id: string): SavedCommuteAnchor[] => {
  const current = getSavedCommutes();
  const updated = current.filter((c) => c.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('commutes-updated'));
  } catch (e) {
    console.error('Failed to remove commute destination:', e);
  }
  return updated;
};
