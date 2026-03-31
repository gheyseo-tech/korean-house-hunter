import { config } from './config.ts'

/** 만원 → 읽기 좋은 형태 (예: 30000 → "3억", 35000 → "3.5억", 1500 → "1,500만") */
export function formatPrice(manwon: number): string {
  if (manwon >= 10000) {
    const eok = manwon / 10000
    const remainder = manwon % 10000
    if (remainder === 0) return `${eok}억`
    if (remainder % 1000 === 0) return `${Math.floor(eok)}억 ${remainder.toLocaleString()}만`
    return `${eok.toFixed(1)}억`.replace('.0억', '억')
  }
  return `${manwon.toLocaleString()}만`
}

/** 만원 → 간단 표시 (예: 30000 → "3억", 35500 → "3.55억") */
export function formatPriceShort(manwon: number): string {
  if (manwon >= 10000) {
    const eok = manwon / 10000
    if (Number.isInteger(eok)) return `${eok}억`
    return `${eok.toFixed(1)}억`.replace('.0억', '억')
  }
  return `${manwon.toLocaleString()}만`
}

/** 만원 → 월 상환액 표시 */
export function formatMonthly(manwon: number): string {
  return `월 ${manwon.toLocaleString()}만원`
}

/** 이사 목표일 — 환경변수로 설정, 비어있으면 비활성 */
export const MOVE_TARGET = config.moveTarget

/** 입주 가능 여부 */
export function getMoveInStatus(moveInDate: string | null | undefined): { ok: boolean; label: string } {
  if (!moveInDate) return { ok: true, label: '즉시입주' }
  if (!MOVE_TARGET) {
    return { ok: true, label: moveInDate.slice(5).replace('-', '/') + ' 입주' }
  }
  const target = new Date(MOVE_TARGET)
  const moveIn = new Date(moveInDate)
  if (moveIn <= target) {
    return { ok: true, label: moveInDate.slice(5).replace('-', '/') + ' 입주' }
  }
  return { ok: false, label: moveInDate.slice(0, 7).replace('-', '.') + ' 이후' }
}

/** m² → 평 변환 */
export function m2ToPyeong(m2: number): number {
  return Math.round(m2 / 3.3058 * 10) / 10
}

/** 평 → m² 변환 */
export function pyeongToM2(pyeong: number): number {
  return Math.round(pyeong * 3.3058 * 10) / 10
}
