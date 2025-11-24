import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

import fs from 'fs';

// 구글 플레이스 API 기본 설정
const API = 'https://places.googleapis.com/v1';
const API_KEY = process.env.PLACES_API_KEY;

// .env 에서 스냅샷 읽어오기
const SNAPSHOT_LAT = Number(process.env.SNAPSHOT_LAT);
const SNAPSHOT_LNG = Number(process.env.SNAPSHOT_LNG);
const SNAPSHOT_RADIUS = Number(process.env.SNAPSHOT_RADIUS);
const SNAPSHOT_TYPES = String(process.env.SNAPSHOT_TYPES)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const SNAPSHOT_LIMIT = Number(process.env.SNAPSHOT_LIMIT);

// 오늘 날짜 문자열 만들기
function getTodayString() {
  // 2025-xx-xx 형식으로 잘라 사용
  return new Date().toISOString().slice(0, 10);
}

// 구글 플레이스 호출해서 데이터 받아오기
async function fetchNearbyPlacesForSnapshot() {
  const url = `${API}/places:searchNearby`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      // 필드마스크: 스냅샷에서 필요할 필드만 요청
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.rating',
        'places.userRatingCount',
      ].join(','),
    },
    body: JSON.stringify({
      includedTypes: SNAPSHOT_TYPES,
      maxResultCount: SNAPSHOT_LIMIT, // 최대 숫자만큼 요청
      rankPreference: 'POPULARITY', // 인기 순
      locationRestriction: {
        circle: {
          center: {
            latitude: SNAPSHOT_LAT,
            longitude: SNAPSHOT_LNG,
          },
          radius: SNAPSHOT_RADIUS, // 미터 단위
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API 에러: ${res.status} ${text}`);
  }

  // JSON 응답 파싱
  const data = await res.json();
  return data.places ?? []; // 없으면 빈 배열
}

// 받아온 데이터에서 리뷰 수 기준 Top 20만 남기기
function pickTop20ByReviewCount(places) {
  // userRatingCount(리뷰 수) 기준으로 내림차순 정렬
  const sorted = [...places].sort(
    (a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0)
  );

  // 앞에서부터 20개만 잘라서 사용
  return sorted.slice(0, 20);
}

// 파일로 저장하는 함수
function saveSnapshotToFile({ dateStr, params, items }) {
  // server/data 폴더가 없으면 생성
  const dir = './server/data';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = `${dir}/${dateStr}.json`;

  const payload = {
    savedAt: new Date().toISOString(), // 저장 시각
    params, // 어떤 옵션으로 수집했는지 기록
    items, // Top 20 가게 리스트
  };

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`스냅샷 저장 완료: ${filePath}`);
}

// 전체 흐름을 한 번에 실행
async function runDailySnapshot() {
  try {
    console.log('스냅샷 수집 시작...');

    const places = await fetchNearbyPlacesForSnapshot();
    console.log(`받아온 가게 수: ${places.length}개`);

    const top20 = pickTop20ByReviewCount(places);
    console.log(`Top 20 추출 완료 (실제 개수: ${top20.length}개)`);

    const dateStr = getTodayString();

    saveSnapshotToFile({
      dateStr,
      params: {
        lat: SNAPSHOT_LAT,
        lng: SNAPSHOT_LNG,
        radius: SNAPSHOT_RADIUS,
        types: SNAPSHOT_TYPES,
        limit: SNAPSHOT_LIMIT,
      },
      items: top20,
    });

    console.log('스냅샷 작업 전체 완료!');
  } catch (err) {
    console.error('스냅샷 작업 중 오류 발생:', err.message);
  }
}

// 이 파일을 실행했을 때만 runDailySnapshot()를 실행
runDailySnapshot();
