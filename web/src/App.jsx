import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';

import { fetchSnapshotComparison } from './lib/api';
import Graph from './Graph';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null); // 스냅샷 비교 결과 전체

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');
        const json = await fetchSnapshotComparison();
        setData(json);
      } catch (e) {
        setError(e.message || '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // 서버에서 오는 필드 이름에 맞춰 사용
  const summary = useMemo(() => {
    if (!data?.changes) return null;

    let totalReviewDelta = 0;
    let ratingUpCount = 0;
    let ratingDownCount = 0;

    data.changes.forEach((c) => {
      const dReviews =
        c.reviewDiff ?? (c.curReviews ?? 0) - (c.prevReviews ?? 0);

      const dRating =
        c.ratingDiff ??
        ((c.curRating ?? null) != null && (c.prevRating ?? null) != null
          ? c.curRating - c.prevRating
          : 0);

      totalReviewDelta += dReviews;
      if (dRating > 0) ratingUpCount += 1;
      else if (dRating < 0) ratingDownCount += 1;
    });

    return {
      totalReviewDelta,
      ratingUpCount,
      ratingDownCount,
      totalPlacesPrevious: data.totalPlacesPrevious ?? data.changes.length,
      totalPlacesLatest: data.totalPlacesLatest ?? data.changes.length,
    };
  }, [data]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 헤더 */}
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          동네 가게 리뷰 대시보드
        </Typography>
        <Typography variant="body1" color="text.secondary">
          하루에 한 번 저장된 스냅샷을 기준으로,{' '}
          <strong>{data?.baseDate ?? '...'}</strong> 와{' '}
          <strong>{data?.compareDate ?? '...'}</strong> 사이의
          <br />
          리뷰 수 변화와 평점 변화를 한눈에 볼 수 있는 대시보드입니다.
        </Typography>
      </Box>

      {/* 로딩 / 에러 상태 */}
      {loading && (
        <Box display="flex" justifyContent="center" my={6}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 실제 콘텐츠 */}
      {!loading && !error && data && summary && (
        <>
          {/* 요약 카드 영역 */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                총 가게 수
              </Typography>
              <Typography variant="h5">
                {summary.totalPlacesPrevious} → {summary.totalPlacesLatest}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                비교 기준: {data.baseDate} vs {data.compareDate}
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                리뷰 수 총 변화
              </Typography>
              <Typography variant="h5">
                {summary.totalReviewDelta > 0 ? '+' : ''}
                {summary.totalReviewDelta.toLocaleString()} 개
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                평점 변화 가게 수
              </Typography>
              <Typography
                variant="body2"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <TrendingUpIcon fontSize="small" color="success" />
                상승: {summary.ratingUpCount} 곳
              </Typography>
              <Typography
                variant="body2"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <TrendingDownIcon fontSize="small" color="error" />
                하락: {summary.ratingDownCount} 곳
              </Typography>
              <Typography
                variant="body2"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <HorizontalRuleIcon fontSize="small" />
                변동 없음:{' '}
                {summary.totalPlacesLatest -
                  summary.ratingUpCount -
                  summary.ratingDownCount}{' '}
                곳
              </Typography>
            </Paper>
          </Stack>

          {/* 그래프 영역 */}
          <Graph changes={data.changes} />

          {/* 상세 테이블 */}
          <Paper>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      가게 이름
                    </TableCell>
                    <TableCell>주소</TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      이전 <br />
                      리뷰 수
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      최신 <br />
                      리뷰 수
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      리뷰 <br />
                      증감
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      이전 <br />
                      평점
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      최신 <br />
                      평점
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      평점 <br />
                      증감
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.changes.map((c) => {
                    // 서버 구조에 맞춰 데이터 읽기
                    const prevReviews = c.prevReviews ?? 0;
                    const latestReviews = c.curReviews ?? 0;
                    const diffReviews =
                      c.reviewDiff ?? latestReviews - prevReviews;

                    const prevRatingRaw = c.prevRating;
                    const latestRatingRaw = c.curRating;
                    const diffRatingRaw =
                      c.ratingDiff ??
                      ((latestRatingRaw ?? null) != null &&
                      (prevRatingRaw ?? null) != null
                        ? latestRatingRaw - prevRatingRaw
                        : 0);

                    const prevRating = prevRatingRaw ?? 0;
                    const latestRating = latestRatingRaw ?? 0;
                    const diffRating = diffRatingRaw ?? 0;

                    const hasReviewChange = diffReviews !== 0;
                    const hasRatingChange = diffRating !== 0;

                    return (
                      <TableRow key={c.id}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {c.name || '(이름 없음)'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {c.formattedAddress || ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{prevReviews}</TableCell>
                        <TableCell align="right">{latestReviews}</TableCell>
                        <TableCell align="right">
                          {hasReviewChange ? (
                            <Chip
                              size="small"
                              label={`${
                                diffReviews > 0 ? '+' : ''
                              }${diffReviews}`}
                              color={diffReviews > 0 ? 'primary' : 'error'}
                              variant="filled"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {prevRating.toFixed(1)}
                        </TableCell>
                        <TableCell align="right">
                          {latestRating.toFixed(1)}
                        </TableCell>
                        <TableCell align="right">
                          {hasRatingChange ? (
                            <Chip
                              size="small"
                              label={`${
                                diffRating > 0 ? '+' : ''
                              }${diffRating.toFixed(1)}`}
                              color={diffRating > 0 ? 'success' : 'error'}
                              variant="outlined"
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Container>
  );
}
