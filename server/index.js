import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors()); // 배포 시 제한 필요

// 구글 플레이스 API 설정
const API = 'https://places.googleapis.com/v1';
const API_KEY = process.env.PLACES_API_KEY;

// 라이브 주변 상점 목록 조회 API
app.get('/api/places/nearby', async (req, res) => {
  try {
    // 쿼리 파라미터 파싱
    const {
      lat,
      lng,
      radius = '2000', // 기본 2km
      types = 'restaurant', // 기본: 식당
      limit = '20', // 한 번에 최대 20개 (Places v1: 1~20)
    } = req.query;

    // 필수값 검사
    if (!lat || !lng) {
      return res
        .status(400)
        .json({ error: '위도(lat)와 경도(lng)가 필요합니다.' });
    }

    // Google Places API - searchNearby 호출
    const resp = await fetch(`${API}/places:searchNearby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        // FieldMask: 필요한 필드만 최소로
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
        includedTypes: String(types)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        maxResultCount: Number(limit), // 1~20
        rankPreference: 'POPULARITY', // 인기순
        locationRestriction: {
          circle: {
            center: {
              latitude: Number(lat),
              longitude: Number(lng),
            },
            radius: Number(radius), // 미터 단위
          },
        },
      }),
    });

    // 구글 API 에러 처리
    if (!resp.ok) {
      const text = await resp.text();
      return res
        .status(resp.status)
        .json({ error: '플레이스 API 에러', detail: text });
    }

    // 성공 시 JSON 파싱
    const data = await resp.json();

    // 결과 전달
    res.json({
      items: data.places ?? [],
      meta: {
        cached: false,
        source: 'places:searchNearby',
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * ./server/data 안의 스냅샷 파일(YYYY-MM-DD.json)을 읽어 가장 최근 2개를 비교해서 변화량을 계산
 */
function compareLatestSnapshots() {
  const dir = './server/data';

  // 폴더 존재 확인
  if (!fs.existsSync(dir)) {
    throw new Error(
      '스냅샷 폴더가 없습니다. 먼저 snapshot:daily 를 두 번 이상 실행해 주세요.'
    );
  }

  // .json 파일 목록 읽기
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort(); // 날짜 순

  if (files.length < 2) {
    throw new Error(
      '비교할 스냅샷 파일이 2개 이상 필요합니다. snapshot:daily 를 최소 2일 실행해 주세요.'
    );
  }

  const latest = files[files.length - 1]; // 가장 최근
  const previous = files[files.length - 2]; // 그 전날

  // 파일 내용 읽어서 JSON 파싱
  const latestData = JSON.parse(
    fs.readFileSync(path.join(dir, latest), 'utf-8')
  );
  const previousData = JSON.parse(
    fs.readFileSync(path.join(dir, previous), 'utf-8')
  );

  const latestItems = latestData.items ?? [];
  const previousItems = previousData.items ?? [];

  // id 기준으로 찾을 수 있게 맵 생성
  const latestMap = new Map();
  for (const p of latestItems) {
    latestMap.set(p.id, p);
  }
  const previousMap = new Map();
  for (const p of previousItems) {
    previousMap.set(p.id, p);
  }

  // 변화량 계산
  const changes = [];

  for (const [id, cur] of latestMap.entries()) {
    const prev = previousMap.get(id);

    const curReviews = cur.userRatingCount ?? 0;
    const prevReviews = prev?.userRatingCount ?? 0;

    const curRating = cur.rating ?? null;
    const prevRating = prev?.rating ?? null;

    const reviewDiff = curReviews - prevReviews;
    const ratingDiff =
      curRating != null && prevRating != null ? curRating - prevRating : null;

    changes.push({
      id,
      name: cur.displayName?.text ?? '',
      formattedAddress: cur.formattedAddress ?? '',
      prevReviews,
      curReviews,
      reviewDiff,
      prevRating,
      curRating,
      ratingDiff,
    });
  }

  // 리뷰 증가량 기준으로 내림차순 정렬
  changes.sort((a, b) => b.reviewDiff - a.reviewDiff);

  // 최종 결과 구조
  return {
    baseDate: previous.replace('.json', ''), // 비교 기준 날짜(이전)
    compareDate: latest.replace('.json', ''), // 비교 대상 날짜(최신)
    totalPlacesPrevious: previousItems.length,
    totalPlacesLatest: latestItems.length,
    changes,
  };
}

// 스냅샷 비교 결과 API
app.get('/api/snapshots/diff', (req, res) => {
  try {
    const result = compareLatestSnapshots();
    res.json(result);
  } catch (err) {
    // 스냅샷 파일 부족, 폴더 없음, JSON 파싱 에러 등
    res.status(500).json({ error: err.message });
  }
});

//  서버 시작
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`서버 작동! http://localhost:${port}`);
});
