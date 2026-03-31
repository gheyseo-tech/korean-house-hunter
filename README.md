# 내 집 찾기 (Korean House Hunter)

내 집 마련을 위한 모바일 웹앱. 매물 관리, 자금 시뮬레이션, 비교 분석, 임장 체크까지.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgheyseo%2Fkorean-house-hunter&env=VITE_APP_NAME,VITE_PASSWORD&envDescription=Set%20your%20app%20name%20and%20password&envLink=https%3A%2F%2Fgithub.com%2Fgheyseo%2Fkorean-house-hunter%23environment-variables)

## Features

- **매물 관리** — 매물 등록, 사진, 중개사 정보, 메모
- **자금 시뮬레이션** — 자산 입력, LTV/DSR 계산, 상환 방식 비교
- **매물 비교** — 교통, 비용, 미래가치 한눈에 비교
- **임장 체크리스트** — 현장에서 바로 체크 (배관/누수/소음/보안 등)
- **정책 가이드** — 취득세, 중개수수료, DSR 규정 참고
- **순위 매기기** — 내 선호도로 순위 관리
- **비밀번호 잠금** — 간단한 접근 제한

## Quick Start

```bash
# 1. Clone
git clone https://github.com/gheyseo/korean-house-hunter.git
cd korean-house-hunter

# 2. Install
npm install

# 3. Configure (optional)
cp .env.example .env
# Edit .env with your settings

# 4. Run
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_APP_NAME` | 내 집 찾기 | App title |
| `VITE_APP_SUBTITLE` | 내 집 마련 프로젝트 | Login page subtitle |
| `VITE_PASSWORD` | house2026 | Access password |
| `VITE_MOVE_TARGET` | (empty) | Move-in deadline (YYYY-MM-DD) |
| `VITE_WORKPLACE` | 회사 | Workplace name for commute |
| `VITE_SUPABASE_URL` | (empty) | Supabase project URL |
| `VITE_SUPABASE_KEY` | (empty) | Supabase publishable key |

## Data Storage

- **Default**: localStorage (browser only, no sync)
- **Optional**: Supabase for cross-device sync. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY`.

## Tech Stack

React 19 + Vite 8 + TypeScript + Tailwind CSS 4

## Deploy

Click the **Deploy with Vercel** button above, or:

```bash
npm install -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard > Settings > Environment Variables.

## License

MIT
