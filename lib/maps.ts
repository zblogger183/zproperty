export interface LatLng {
  lat: number;
  lng: number;
}

export function boundsFromPoints(points: LatLng[]): [LatLng, LatLng] | null {
  if (points.length === 0) return null;

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);

  return [
    { lat: Math.min(...lats), lng: Math.min(...lngs) },
    { lat: Math.max(...lats), lng: Math.max(...lngs) },
  ];
}
