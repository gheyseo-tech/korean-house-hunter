import { ACQ_TAX, BROKERAGE, LEGAL_FEE, DSR_LIMIT } from './constants.ts'
import type { FinanceConfig, SimulationResult } from '../types/finance.ts'

/** 취득세 계산 (만원) */
export function calcAcquisitionTax(price: number, isFirstTime: boolean): number {
  let tax: number

  if (price <= 60000) {
    // 6억 이하
    tax = price * ACQ_TAX.RATE_UNDER_6
  } else if (price <= 90000) {
    // 6~9억 구간세율: 세율 = (매매가(억) * 2/3 - 3) / 100
    const priceInEok = price / 10000
    const rate = (priceInEok * 2 / 3 - 3) / 100 + 0.001 // +0.1% 지방교육세
    tax = price * rate
  } else {
    // 9억 초과
    tax = price * ACQ_TAX.RATE_OVER_9
  }

  // 생애최초 감면
  if (isFirstTime && price <= ACQ_TAX.FIRST_TIME_MAX_PRICE) {
    tax = Math.max(0, tax - ACQ_TAX.FIRST_TIME_DISCOUNT)
  }

  return Math.round(tax)
}

/** 중개 수수료 계산 (만원) */
export function calcBrokerageFee(price: number): number {
  for (const tier of BROKERAGE) {
    if (price < tier.max) {
      const fee = price * tier.rate
      return Math.round(tier.cap ? Math.min(fee, tier.cap) : fee)
    }
  }
  return 0
}

export type RepaymentType = 'equal-payment' | 'equal-principal'

/** 원리금균등 월 상환액 계산 (만원) — 매월 동일 */
export function calcMonthlyPayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || annualRate <= 0 || years <= 0) return 0
  const r = annualRate / 100 / 12
  const n = years * 12
  const payment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  return Math.round(payment * 10) / 10
}

/** 원금균등 — 첫 달(최대), 마지막 달(최소), 총 이자 */
export function calcEqualPrincipal(principal: number, annualRate: number, years: number) {
  if (principal <= 0 || annualRate <= 0 || years <= 0) return { first: 0, last: 0, totalInterest: 0 }
  const r = annualRate / 100 / 12
  const n = years * 12
  const monthlyPrincipal = principal / n
  const first = Math.round((monthlyPrincipal + principal * r) * 10) / 10
  const last = Math.round((monthlyPrincipal + monthlyPrincipal * r) * 10) / 10
  const totalInterest = Math.round(principal * r * (n + 1) / 2)
  return { first, last, totalInterest }
}

/** 원리금균등 총 이자 */
export function calcEqualPaymentTotalInterest(principal: number, annualRate: number, years: number): number {
  const monthly = calcMonthlyPayment(principal, annualRate, years)
  return Math.round(monthly * years * 12 - principal)
}

/** DSR 계산 (%) */
export function calcDSR(monthlyPayment: number, annualIncome: number): number {
  if (annualIncome <= 0) return 0
  return Math.round((monthlyPayment * 12) / annualIncome * 1000) / 10
}

/** DSR 40% 기준 최대 대출 가능액 역산 (만원) */
export function calcMaxLoan(annualIncome: number, annualRate: number, years: number): number {
  if (annualIncome <= 0 || annualRate <= 0 || years <= 0) return 0
  const maxMonthly = annualIncome * DSR_LIMIT / 12
  const r = annualRate / 100 / 12
  const n = years * 12
  const maxPrincipal = maxMonthly * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n))
  return Math.floor(maxPrincipal)
}

/** 종합 시뮬레이션 */
export function simulate(price: number, config: FinanceConfig): SimulationResult {
  const availableEquity = config.assets
    .filter(a => a.included)
    .reduce((sum, a) => sum + a.amount, 0)

  const ltvRate = config.ltvRate / 100
  const loanAmount = Math.floor(price * ltvRate)
  const equityNeeded = price - loanAmount

  const acquisitionTax = calcAcquisitionTax(price, config.isFirstTimeBuyer)
  const brokerageFee = calcBrokerageFee(price)
  const totalCosts = acquisitionTax + brokerageFee + LEGAL_FEE + config.movingCost + config.etcCost
  const totalNeeded = equityNeeded + totalCosts

  const monthlyPayment = calcMonthlyPayment(loanAmount, config.loanInterestRate, config.loanTermYears)
  const dsr = calcDSR(monthlyPayment, config.annualIncome)

  const gap = availableEquity - totalNeeded
  const feasible = gap >= 0 && dsr <= DSR_LIMIT * 100

  return {
    purchasePrice: price,
    acquisitionTax,
    brokerageFee,
    totalCosts,
    equityNeeded,
    totalNeeded,
    availableEquity,
    loanAmount,
    monthlyPayment,
    dsr,
    gap,
    feasible,
  }
}

/** 최대 매수 가능 금액 계산 (만원) */
export function calcMaxPurchasePrice(config: FinanceConfig): number {
  const availableEquity = config.assets
    .filter(a => a.included)
    .reduce((sum, a) => sum + a.amount, 0)

  const ltvRate = config.ltvRate / 100
  const maxLoanByDSR = calcMaxLoan(config.annualIncome, config.loanInterestRate, config.loanTermYears)

  // 이진 탐색으로 최대 매수가 찾기
  let lo = 0
  let hi = 200000 // 20억
  while (hi - lo > 100) { // 100만원 단위
    const mid = Math.floor((lo + hi) / 2)
    const result = simulate(mid, config)
    const loanByLTV = Math.floor(mid * ltvRate)
    const actualLoan = Math.min(loanByLTV, maxLoanByDSR)
    const needed = mid - actualLoan + result.totalCosts

    if (needed <= availableEquity && result.dsr <= DSR_LIMIT * 100) {
      lo = mid
    } else {
      hi = mid
    }
  }
  return lo
}
