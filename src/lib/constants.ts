// 2026년 기준 부동산 정책 상수
// 변경 시 이 파일만 수정

// 취득세율 (주택)
export const ACQ_TAX = {
  RATE_UNDER_6: 0.011,        // 6억 이하: 1.1% (취득세 1% + 지방교육세 0.1%)
  RATE_OVER_9: 0.033,         // 9억 초과: 3.3% (3% + 0.3%)
  FIRST_TIME_DISCOUNT: 200,   // 생애최초 감면 한도 (만원), 12억 이하 주택
  FIRST_TIME_MAX_PRICE: 120000, // 생애최초 감면 대상 최대 매매가 (만원 = 12억)
}

// 중개 수수료율
export const BROKERAGE = [
  { max: 5000, rate: 0.006, cap: 25 },     // 5천만 미만
  { max: 20000, rate: 0.005, cap: 80 },    // 2억 미만
  { max: 60000, rate: 0.004, cap: null },   // 6억 미만
  { max: 90000, rate: 0.005, cap: null },   // 9억 미만
  { max: Infinity, rate: 0.009, cap: null }, // 9억 이상
]

// 법무사 비용 (근사치)
export const LEGAL_FEE = 60 // 만원

// DSR 한도
export const DSR_LIMIT = 0.40

// LTV
export const LTV_NORMAL = 0.70
export const LTV_FIRST_TIME = 0.80
export const LTV_FIRST_TIME_MAX_PRICE = 90000 // 9억 이하 주택만 80% 적용
