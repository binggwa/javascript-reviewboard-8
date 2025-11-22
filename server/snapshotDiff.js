// server/snapshotDiff.js
// 스냅샷 파일들 중에서 가장 최근 날짜(오늘)와 그 이전 날짜(어제/마지막 저장일)를 찾아서 가게별 리뷰/별점 변화량을 계산
import fs from 'fs';
import path from 'path';

// 스냅샷 폴더 경로
const SNAPSHOT_DIR = './server/data';

// data 폴더에서 가장 최근 2개의 날짜 파일 찾기
export function getLatestTwoSnapshotFiles() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    throw new Error(
      '스냅샷 폴더가 아직 없습니다. 먼저 snapshot:daily를 실행하세요.'
    );
  }

  // 폴더 안의 파일 목록 읽기
  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith('.json')) // .json 파일만
    .sort(); // 이름 기준 정렬 (YYYY-MM-DD.json 날짜 순과 동일)

  if (files.length < 2) {
    throw new Error('비교를 위해서는 최소 2개의 스냅샷 파일이 필요합니다.');
  }

  // 가장 최근 2개 파일
  const latest = files[files.length - 1];
  const prev = files[files.length - 2];

  return {
    latestPath: path.join(SNAPSHOT_DIR, latest),
    prevPath: path.join(SNAPSHOT_DIR, prev),
    latestDate: latest.replace('.json', ''),
    prevDate: prev.replace('.json', ''),
  };
}

// 두 스냅샷 JSON 읽어서 파싱
function loadSnapshot(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

// 두 스냅샷을 비교해서 가게별 변화량 계산
export function compareLatestSnapshots() {
  const { latestPath, prevPath, latestDate, prevDate } =
    getLatestTwoSnapshotFiles();

  const latest = loadSnapshot(latestPath);
  const prev = loadSnapshot(prevPath);

  const latestItems = latest.items ?? [];
  const prevItems = prev.items ?? [];

  // 이전 스냅샷을 id로 빠르게 찾을 수 있게 Map으로 변환
  const prevMap = new Map();
  for (const p of prevItems) {
    prevMap.set(p.id, p);
  }

  // 가게별 변화량 결과 배열
  const diffItems = latestItems.map((now) => {
    const before = prevMap.get(now.id); // 이전 스냅샷에 같은 id가 있으면 가져옴

    const nowRating = now.rating ?? 0;
    const nowReviews = now.userRatingCount ?? 0;

    const prevRating = before?.rating ?? 0;
    const prevReviews = before?.userRatingCount ?? 0;

    const ratingDiff = nowRating - prevRating;
    const reviewsDiff = nowReviews - prevReviews;

    return {
      id: now.id,
      name: now.displayName?.text ?? '(이름 없음)',
      address: now.formattedAddress ?? '',
      ratingNow: nowRating,
      ratingPrev: prevRating,
      ratingDiff,
      reviewsNow: nowReviews,
      reviewsPrev: prevReviews,
      reviewsDiff,
    };
  });

  // 리뷰 증가 수 기준으로 내림차순 정렬
  diffItems.sort((a, b) => b.reviewsDiff - a.reviewsDiff);

  // 전체 요약 정보 함께 리턴
  return {
    latestDate,
    prevDate,
    params: latest.params, // 어떤 조건으로 모았는지 (lat, lng, radius 등)
    totalCount: latestItems.length,
    diffItems,
  };
}