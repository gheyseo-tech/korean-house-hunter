export interface AssetItem {
  id: string
  label: string
  amount: number        // 만원 단위
  included: boolean
  isVariable: boolean   // 변동 자산 (주식, 차량 등)
}

export interface FinanceConfig {
  assets: AssetItem[]
  annualIncome: number      // 연소득 (만원)
  monthlyTakeHome: number   // 월 실수령 (만원)
  ltvRate: 70 | 80
  loanInterestRate: number  // 연 금리 (%, 예: 3.5)
  loanTermYears: number     // 대출 기간 (년)
  isFirstTimeBuyer: boolean
  movingCost: number        // 이사비 (만원)
  etcCost: number           // 기타 비용 (만원)
}

export interface SimulationResult {
  purchasePrice: number
  acquisitionTax: number
  brokerageFee: number
  totalCosts: number
  equityNeeded: number      // 자기부담금 (매매가 - 대출)
  totalNeeded: number       // 자기부담금 + 부대비용
  availableEquity: number
  loanAmount: number
  monthlyPayment: number
  dsr: number
  gap: number               // + 여유, - 부족
  feasible: boolean
}

export const DEFAULT_FINANCE: FinanceConfig = {
  assets: [
    { id: 'savings', label: '예금/적금', amount: 0, included: true, isVariable: false },
    { id: 'etc', label: '기타 자산', amount: 0, included: true, isVariable: true },
  ],
  annualIncome: 5000,
  monthlyTakeHome: 350,
  ltvRate: 70,
  loanInterestRate: 4.1,
  loanTermYears: 30,
  isFirstTimeBuyer: true,
  movingCost: 150,
  etcCost: 70,
}
