# javascript-reviewboard-precourse
## 프로젝트 구조
```
project/
|-- server/
| |-- index.js
│ |-- saveDailyData.js
│ |-- snapshotDiff.js
│ ㄴ-- data/
│   ㄴ-- YYYY-MM-DD.json
ㄴ-- web/
  |-- src/
  |  |-- App.css
  |  |-- App.jsx
  |  |-- Graph.jsx
  |  |-- main.jsx
  |  |-- index.css
  |  ㄴ-- lib/api.js
  |-- index.html
  ㄴ-- package.json
```
## 구현할 기능 목록
### server
#### index.js
- [x] 주변 상점 조회 기능 구현
  - [x] Google Places API v1 사용
  - [x] API 키를 .env로 분리하여 노출 방지
  - 전달 항목
    - [x] 위도/경도
    - [x] radius (기본 반경 2000m)
    - [x] types (기본 restaurant)
    - [x] limit (최대 20)
  - [x] 위도/경도 입력값 검증 (lat/lng 미입력 시 400 반환)
  - [x] Google API 과금량 최소화를 위한 FieldMask 설정
  - [x] 오류 발생 시 구글 응답을 그대로 전달
- [x] 일일 스냅샷 비교 기능
  - [x] 일일 스냅샷 스캔해서 최신 2개 비교
  - [x] 전날 대비 리뷰 수 변화
  - [x] 전날 대비 평점 변화
  - [x] 증가량 내림차순 정렬
- [x] /api/snapshots/diff API
  - [x] 파일 갯수 부족 시 에러
  - [x] JSON 반환 구조 표준화
- [x] 서버 기본 포트 설정 및 실행
#### saveDailyData.js
- [x] 수동 실행으로 매일 스냅샷 저장기능
  - [x] Google Places API 호출해서 매일 데이터 수집
  - [x] server/data/YYYY-MM-DD.json 형태로 저장
  - [x] 파일 중복 방지
### client (web)
#### Graph.jsx
- [x] 3종 그래프 구현
  - [x] 이전 vs 최신 리뷰 수 비교 BarChart
  - [x] 리뷰 증감 그래프
  - [x] 평점 변화 LineChart
  - [x] tooltip에서 가게 이름이 정확히 표시되도록 커스터마이즈
#### App.jsx
- [x] 스냅샷 데이터 테이블
  - [x] 가게 이름
  - [x] 주소
  - [x] 이전/최신 리뷰 수
  - [x] 리뷰 증감
  - [x] 이전/최신 평점
  - [x] 평점 증감
- [x] 레이아웃 개선
  - [x] nowrap으로 테이블 column 줄바꿈 방지
  - [x] Chip 색상 커스텀 증감 표현
#### main.jsx
- [x] MUI ThemeProvider 적용
- [x] 기본 MUI 타이포그래피 폰트적용
- [x] CssBaseline 적용
#### index.css
- [x] 프로젝트 공통 스타일
- [x] background / 색상 / margin
## 배포 방법
### 서버(Node/Express) : Render 사용
- Render 무료 인스턴스 배포
- 서버 주소
```
https://javascript-reviewboard-8-server.onrender.com
```
### 프론트엔드(Vite + React) : Netlify 사용
- Netlify 무료 정적 사이트 배포
- Render 서버를 API로 호출
- 접속 주소
```
https://javascript-reviewboard-8.netlify.app/
```