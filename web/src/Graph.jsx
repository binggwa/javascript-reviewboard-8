import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { BarChart, LineChart } from '@mui/x-charts';

export default function Graph({ changes = [] }) {
  if (!changes || changes.length === 0) {
    return <div>그래프를 표시할 데이터가 없습니다.</div>;
  }

  // 가게 이름
  const labels = changes.map((c) => String(c.name ?? ''));

  // 가게 번호
  const indexLabels = changes.map((_, i) => i + 1);

  // 번호와 가게 이름 매핑
  const numberToName = (n) => labels[n - 1] ?? '';

  // 이전, 최신 리뷰 수
  const prevReviews = changes.map((c) => c.prevReviews ?? 0);
  const curReviews = changes.map((c) => c.curReviews ?? 0);

  // 리뷰 증감
  const reviewDiff = changes.map((c) => c.reviewDiff ?? 0);

  // 이전, 최신 평점
  const ratingPrev = changes.map((c) => c.prevRating ?? 0);
  const ratingCur = changes.map((c) => c.curRating ?? 0);

  const COLOR_PREV = '#2bf07a'; // 옅은 초록
  const COLOR_CUR = '#138bf5ff'; // 옅은 파랑
  const COLOR_UP = '#62aef7'; // 옅은 하늘
  const COLOR_DOWN = '#e74c3c'; // 빨강

  // x축 공통 설정
  const xAxisSetting = {
    scaleType: 'band',
    data: indexLabels,
    valueFormatter: (value, context) => {
      if (context.location === 'tooltip') {
        const index = Number(value) - 1;
        return labels[index] ?? String(value);
      }
      // 축 눈금에는 숫자만 보여주기
      return String(value);
    },
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4, overflowX: 'auto' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          이전 vs 최신 리뷰 수 비교
        </Typography>
        <BarChart
          height={400}
          xAxis={[xAxisSetting]}
          yAxis={[{ label: '리뷰 수' }]}
          grid={{ horizontal: true }}
          margin={{ left: 20, right: 20, top: 30, bottom: 90 }}
          series={[
            {
              data: prevReviews,
              label: '이전 리뷰 수',
              color: COLOR_PREV,
            },
            { data: curReviews, label: '최신 리뷰 수', color: COLOR_CUR },
          ]}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 4, overflowX: 'auto' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          리뷰 증감 그래프
        </Typography>
        <BarChart
          height={400}
          xAxis={[xAxisSetting]}
          yAxis={[
            {
              label: '증감 수',
              valueFormatter: (v) => `${v}`,
            },
          ]}
          grid={{ horizontal: true }}
          margin={{ left: 20, right: 20, top: 30, bottom: 90 }}
          series={[
            {
              data: reviewDiff.map((v) => (v > 0 ? v : 0)),
              label: '리뷰 증가',
              color: COLOR_UP,
            },
            {
              data: reviewDiff.map((v) => (v < 0 ? v : 0)),
              label: '리뷰 감소',
              color: COLOR_DOWN,
            },
          ]}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 4, overflowX: 'auto' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          평점 변화 그래프
        </Typography>
        <LineChart
          height={400}
          xAxis={[xAxisSetting]}
          yAxis={[
            {
              scaleType: 'linear',
              label: '평점 변화',
              min: 0,
              max: 5,
              tickInterval: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
              valueFormatter: (v) => v.toFixed(1),
            },
          ]}
          grid={{ horizontal: true }}
          margin={{ left: 20, right: 20, top: 30, bottom: 90 }}
          series={[
            { data: ratingPrev, label: '이전 평점' },
            { data: ratingCur, label: '최신 평점' },
          ]}
        />
      </Paper>
    </Box>
  );
}
