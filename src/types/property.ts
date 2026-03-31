export type Direction = '동' | '서' | '남' | '북' | '남동' | '남서' | '북동' | '북서'
export type PropertyType = '아파트' | '오피스텔' | '주상복합' | '빌라' | '기타'

export interface PropertyBasic {
  name: string
  propertyType: PropertyType  // 매물 유형
  address: string
  price: number             // 매매가 (만원)
  sizeM2: number            // 전용면적 m²
  pyeong: number            // 평수
  floor: number
  totalFloors: number
  direction: Direction
  buildYear: number         // 준공연도
  maintenanceFee: number    // 관리비 (만원/월)
  rooms: number
  bathrooms: number
}

export interface PropertyLiving {
  stationName: string
  stationMinutes: number | null
  convenience: number       // 1-5
  school: number            // 1-5
  noise: number             // 1-5 (1=조용, 5=시끄러움)
  parking: number           // 1-5
  sunlight: number          // 1-5
  view: number              // 1-5
}

export interface CommuteRoute {
  destination: string           // 목적지 (예: 회사, 강남역)
  duration: string              // 소요시간 (예: "45분")
  route: string                 // 경로 (예: "8호선 → 2호선 환승")
  transfers: number             // 환승 횟수
  distance: string              // 거리 (예: "23km")
}

export interface PropertyInvestment {
  jeonsePrice: number | null    // 전세가 (만원)
  jeonseRate: number | null     // 전세가율 (%, 자동계산)
  priceChange: string           // 시세 변동 메모
  development: string           // 개발 호재 메모
  gapInvestPossible: boolean
}

export interface FieldCheck {
  // 집 안 (리모 비용 직결)
  condition: number        // 1-5 수리 상태 (도배/장판/샷시)
  plumbing: number         // 1-5 배관/녹물
  waterLeak: number        // 1-5 누수/곰팡이/결로
  waterPressure: number    // 1-5 수압/배수
  smell: number            // 1-5 냄새 (하수구/담배/곰팡이)
  // 건물/단지
  elevator: number         // 1-5 엘리베이터 상태
  soundproof: number       // 1-5 방음/복도소음
  security: number         // 1-5 보안 (CCTV/경비실)
  parkingReal: number      // 1-5 주차 실제상태
  buildingMgmt: number     // 1-5 건물관리 (복도/계단/외벽)
  // 체크박스
  balconyExpanded: boolean // 베란다 확장 여부
  visitedNight: boolean    // 야간 방문 여부
  boilerOld: boolean       // 보일러 15년+ 노후
  asbestosSuspect: boolean // 석면 의심
  fieldMemo: string        // 현장 메모 (느낌, 특이사항)
}

export interface AgentInfo {
  name: string                  // 중개사명 (예: "구리행복공인중개사")
  phone: string                 // 전화번호 (예: "031-123-4567")
  memo: string                  // 담당자, 참고사항 등
}

export interface Property {
  id: string
  basic: PropertyBasic
  living: PropertyLiving
  investment: PropertyInvestment
  commutes: CommuteRoute[]
  links: { label: string; url: string }[]  // 네이버 부동산 등 외부 링크
  fieldCheck: FieldCheck | null  // 현장 임장 체크
  agent: AgentInfo | null       // 중개사 정보
  photos: string[]              // base64 (최대 5장)
  memo: string
  moveInDate: string | null     // 입주가능일 YYYY-MM-DD (null=즉시입주)
  rating: number                // 1-5
  rank: number | null           // 선호 순위 (1,2,3... null=미지정)
  visitDate: string             // YYYY-MM-DD
  createdAt: string
  updatedAt: string
}

export const EMPTY_PROPERTY: Omit<Property, 'id' | 'createdAt' | 'updatedAt'> = {
  basic: {
    name: '', propertyType: '아파트', address: '', price: 0, sizeM2: 0, pyeong: 0,
    floor: 0, totalFloors: 0, direction: '남',
    buildYear: 2020, maintenanceFee: 0, rooms: 2, bathrooms: 1,
  },
  living: {
    stationName: '', stationMinutes: null,
    convenience: 3, school: 3, noise: 3, parking: 3, sunlight: 3, view: 3,
  },
  investment: {
    jeonsePrice: null, jeonseRate: null,
    priceChange: '', development: '', gapInvestPossible: false,
  },
  commutes: [
    { destination: '회사', duration: '', route: '', transfers: 0, distance: '' },
    { destination: '강남역', duration: '', route: '', transfers: 0, distance: '' },
  ],
  links: [],
  fieldCheck: null,
  agent: null,
  photos: [],
  memo: '',
  moveInDate: null,
  rating: 0,
  rank: null,
  visitDate: new Date().toISOString().slice(0, 10),
}
