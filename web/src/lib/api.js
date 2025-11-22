const API_BASE = import.meta.env.VITE_API_BASE;

// 주변 검색
export async function fetchNearby({
  lat,
  lng,
  radius = 2000,
  types = 'restaurant',
  limit = 20,
}) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radius),
    types,
    limit: String(limit),
  });
  const res = await fetch(`${API_BASE}/api/places/nearby?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`서버 오류: ${res.status} ${text}`);
  }
  return res.json();
}

// 스냅샷 비교 결과 가져오기
const SNAPSHOT_COMPARE_PATH = '/api/snapshots/diff';

export async function fetchSnapshotComparison() {
  const res = await fetch(`${API_BASE}${SNAPSHOT_COMPARE_PATH}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`스냅샷 비교 API 오류: ${res.status} ${text}`);
  }

  return res.json();
}