import type { Property } from '../types/property.ts'
import type { FinanceConfig } from '../types/finance.ts'
import { simulate } from './finance.ts'

export interface ScoreWeights {
  location: number
  condition: number
  investment: number
  cost: number
}

export interface ScoreBreakdown {
  location: number    // 0-100
  condition: number
  investment: number
  cost: number
  total: number
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  location: 0.35,    // 교통/입지
  condition: 0.2,    // 실거주 컨디션
  investment: 0.25,  // 미래가치
  cost: 0.2,         // 비용 효율
}

/** "50~60분" → 55, "45분" → 45 */
function parseDurationMinutes(s: string): number | null {
  const rangeMatch = s.match(/(\d+)\s*[~\-]\s*(\d+)/)
  if (rangeMatch) return (Number(rangeMatch[1]) + Number(rangeMatch[2])) / 2
  const singleMatch = s.match(/(\d+)/)
  return singleMatch ? Number(singleMatch[1]) : null
}

/** 방향 → 채광 보정 */
function directionSunlightBonus(direction: string): number {
  if (direction === '남') return 1.5
  if (direction === '남동' || direction === '남서') return 1
  if (direction === '동' || direction === '서') return 0
  if (direction === '북동' || direction === '북서') return -0.5
  if (direction === '북') return -1
  return 0
}

/** 지역별 LTV */
export function getRegionLTV(address: string): number {
  if (address.includes('하남')) return 70
  if (address.includes('송파')) return 70
  return 80 // 구리, 남양주 등 비규제
}

/** 유형별 취득세율 */
export function getAcqTaxRate(propertyType: string): number {
  return propertyType === '오피스텔' ? 4.6 : 1.1
}

/** 생애최초 취득세 감면 가능 여부 */
export function canFirstTimeDiscount(propertyType: string): boolean {
  return propertyType !== '오피스텔'
}

export function calcScore(property: Property, config: FinanceConfig, weights: ScoreWeights = DEFAULT_WEIGHTS): ScoreBreakdown {
  const { living, investment, basic } = property
  const buildAge = new Date().getFullYear() - basic.buildYear + 1

  // ── 입지/교통 점수 ──
  const stationScore = living.stationMinutes != null
    ? Math.max(0, 100 - living.stationMinutes * 5)
    : 50

  let gangnamScore = 50
  const gangnamCommute = (property.commutes ?? []).find(c =>
    c.destination.includes('강남') && c.duration
  )
  if (gangnamCommute) {
    const mins = parseDurationMinutes(gangnamCommute.duration)
    if (mins != null) gangnamScore = Math.max(0, Math.min(100, 130 - mins * 1.5))
  }

  let workScore = 50
  const workCommute = (property.commutes ?? []).find(c =>
    c.destination.includes('회사') && c.duration
  )
  if (workCommute) {
    const mins = parseDurationMinutes(workCommute.duration)
    if (mins != null) workScore = Math.max(0, Math.min(100, 130 - mins * 1.5))
  }

  const locationScore = (
    stationScore * 0.2 +
    living.convenience * 20 * 0.1 +
    gangnamScore * 0.35 +
    workScore * 0.35
  )

  // ── 실거주 컨디션 ──
  const noiseInverted = 6 - living.noise
  const adjustedSunlight = Math.max(1, Math.min(5, living.sunlight + directionSunlightBonus(basic.direction)))
  const roomScore = basic.rooms >= 2 ? 20 : 0
  const sizeScore = Math.min(20, basic.pyeong * 1.5)
  const envScore = (adjustedSunlight + living.view + living.parking + noiseInverted) / 4 * 15
  const conditionScore = Math.min(100, roomScore + sizeScore + envScore)

  // ── 미래가치/투자 ──
  let investScore = 20

  // 유형: 아파트 > 주상복합 > 오피스텔
  if (basic.propertyType === '아파트') investScore += 25
  else if (basic.propertyType === '주상복합') investScore += 10
  // 오피스텔은 가산 없음

  // 재건축 가능성: 구축 + 대단지 아파트
  if (basic.propertyType === '아파트' && buildAge >= 25) investScore += 20
  else if (basic.propertyType === '아파트' && buildAge >= 15) investScore += 10

  // 개발 호재
  if (investment.development) investScore += 15

  // 시세 변동 정보 있음
  if (investment.priceChange) investScore += 10

  investScore = Math.min(100, investScore)

  // ── 비용 효율 ──
  const sim = simulate(basic.price, config)
  const isOfficetel = basic.propertyType === '오피스텔'
  const acqTaxPenalty = isOfficetel ? 20 : 0  // 오피스텔 취득세 4.6% 패널티
  const ltvBonus = getRegionLTV(basic.address) === 80 ? 15 : 0
  const firstTimeBonus = canFirstTimeDiscount(basic.propertyType) ? 10 : 0

  let costScore = 50
  if (sim.feasible) costScore += 15 + (sim.gap / basic.price) * 100
  else costScore += (sim.gap / basic.price) * 100
  costScore = costScore - acqTaxPenalty + ltvBonus + firstTimeBonus
  costScore = Math.max(0, Math.min(100, costScore))

  const total = Math.round(
    locationScore * weights.location +
    conditionScore * weights.condition +
    investScore * weights.investment +
    costScore * weights.cost
  )

  return {
    location: Math.round(locationScore),
    condition: Math.round(conditionScore),
    investment: Math.round(investScore),
    cost: Math.round(costScore),
    total,
  }
}
