import { useState } from 'react'
import { calcAcquisitionTax, calcBrokerageFee, calcMonthlyPayment, calcDSR } from '../lib/finance.ts'
import { formatPrice } from '../lib/format.ts'
import { useFinance } from '../hooks/useFinance.ts'

export function PolicyPage() {
  const { config: finConfig } = useFinance()
  const [calcPrice, setCalcPrice] = useState(30000)

  const acqTax = calcAcquisitionTax(calcPrice, true)
  const acqTaxNoDiscount = calcAcquisitionTax(calcPrice, false)
  const brokerage = calcBrokerageFee(calcPrice)

  const loan80 = Math.floor(calcPrice * 0.8)
  const loan70 = Math.floor(calcPrice * 0.7)
  const monthly80 = calcMonthlyPayment(loan80, finConfig.loanInterestRate, finConfig.loanTermYears)
  const monthly70 = calcMonthlyPayment(loan70, finConfig.loanInterestRate, finConfig.loanTermYears)
  const dsr80 = calcDSR(monthly80, finConfig.annualIncome)
  const dsr70 = calcDSR(monthly70, finConfig.annualIncome)

  return (
    <div className="space-y-4">
      {/* 내 상황 요약 */}
      <section className="card p-4 border-primary/30 bg-primary/5">
        <h2 className="font-bold text-sm mb-3">내 설정 기준</h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/80 rounded-lg p-2.5 text-center">
            <p className="text-text-secondary">연소득</p>
            <p className="font-bold text-base">{finConfig.annualIncome.toLocaleString()}만</p>
          </div>
          <div className="bg-white/80 rounded-lg p-2.5 text-center">
            <p className="text-text-secondary">대출 금리</p>
            <p className="font-bold text-base">{finConfig.loanInterestRate}%</p>
          </div>
          <div className="bg-white/80 rounded-lg p-2.5 text-center">
            <p className="text-text-secondary">LTV</p>
            <p className="font-bold text-base">{finConfig.ltvRate}%</p>
          </div>
          <div className="bg-white/80 rounded-lg p-2.5 text-center">
            <p className="text-text-secondary">생애최초</p>
            <p className="font-bold text-base text-success">{finConfig.isFirstTimeBuyer ? '해당' : '비해당'}</p>
          </div>
        </div>
      </section>

      {/* 생애최초 혜택 */}
      <section className="card p-4">
        <h2 className="font-bold text-sm mb-3">생애최초 주택구매 혜택</h2>
        <div className="space-y-2">
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="font-bold text-sm text-success">취득세 200만원 감면</p>
            <p className="text-xs text-text-secondary mt-0.5">12억 이하 주택. 소득 기준 없음 (2026년~)</p>
            <p className="text-xs text-text-secondary">조건: 3개월 내 전입 + 3년 실거주</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="font-bold text-sm text-success">LTV 80% (비규제지역)</p>
            <p className="text-xs text-text-secondary mt-0.5">9억 이하 주택, 비규제지역 한정. 대출 상한 6억</p>
          </div>
        </div>
      </section>

      {/* 비용 계산기 */}
      <section className="card p-4">
        <h2 className="font-bold text-sm mb-3">비용 계산기</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-secondary">매매가 (만원)</label>
            <input type="number" inputMode="numeric" value={calcPrice} onChange={e => setCalcPrice(Number(e.target.value))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" />
            <span className="text-xs text-primary">{formatPrice(calcPrice)}</span>
          </div>

          <div className="border-t border-border pt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">취득세 (일반)</span>
              <span>{formatPrice(acqTaxNoDiscount)}</span>
            </div>
            <div className="flex justify-between text-success">
              <span>취득세 (생애최초)</span>
              <span className="font-bold">{formatPrice(acqTax)} <span className="text-xs">(-{formatPrice(acqTaxNoDiscount - acqTax)})</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">중개수수료</span>
              <span>{formatPrice(brokerage)}</span>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs font-bold mb-2">LTV별 대출 비교 ({finConfig.loanInterestRate}% · {finConfig.loanTermYears}년)</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-1.5 text-left text-text-secondary font-normal"></th>
                  <th className="py-1.5 text-center text-success font-medium">비규제 80%</th>
                  <th className="py-1.5 text-center font-medium">규제 70%</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-1.5 text-text-secondary">대출금</td>
                  <td className="py-1.5 text-center font-medium">{formatPrice(loan80)}</td>
                  <td className="py-1.5 text-center font-medium">{formatPrice(loan70)}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-1.5 text-text-secondary">월 상환</td>
                  <td className="py-1.5 text-center font-bold">{monthly80.toLocaleString()}만</td>
                  <td className="py-1.5 text-center font-bold">{monthly70.toLocaleString()}만</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-text-secondary">DSR</td>
                  <td className={`py-1.5 text-center font-bold ${dsr80 > 40 ? 'text-danger' : ''}`}>{dsr80}%</td>
                  <td className={`py-1.5 text-center font-bold ${dsr70 > 40 ? 'text-danger' : ''}`}>{dsr70}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* DSR 규정 */}
      <section className="card p-4">
        <h2 className="font-bold text-sm mb-3">DSR 40% 규정</h2>
        <div className="text-sm space-y-2">
          <p className="text-text-secondary">연간 원리금 상환액이 연소득의 <strong>40%</strong> 초과 시 대출 불가</p>
          <div className="bg-bg p-3 rounded-lg text-xs space-y-1">
            <p>내 연소득: <strong>{finConfig.annualIncome.toLocaleString()}만원</strong></p>
            <p>최대 연 상환: <strong>{Math.round(finConfig.annualIncome * 0.4).toLocaleString()}만원</strong> (월 {Math.round(finConfig.annualIncome * 0.4 / 12).toLocaleString()}만원)</p>
          </div>
        </div>
      </section>

      {/* 취득세율 참고 */}
      <section className="card p-4">
        <h2 className="font-bold text-sm mb-3">취득세율 참고</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 text-left text-text-secondary font-normal">매매가</th>
              <th className="py-2 text-right text-text-secondary font-normal">세율</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-border"><td className="py-2">6억 이하</td><td className="py-2 text-right">1.1%</td></tr>
            <tr className="border-b border-border"><td className="py-2">6~9억</td><td className="py-2 text-right">1.1~3.3%</td></tr>
            <tr><td className="py-2">9억 초과</td><td className="py-2 text-right">3.3%</td></tr>
          </tbody>
        </table>
        <p className="text-[10px] text-text-secondary mt-2">오피스텔(업무시설)은 4.6% 별도 세율 적용</p>
      </section>

      {/* 중개수수료율 참고 */}
      <section className="card p-4">
        <h2 className="font-bold text-sm mb-3">중개수수료율 참고</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 text-left text-text-secondary font-normal">매매가</th>
              <th className="py-2 text-right text-text-secondary font-normal">요율</th>
              <th className="py-2 text-right text-text-secondary font-normal">한도</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-border"><td className="py-2">5천만 미만</td><td className="py-2 text-right">0.6%</td><td className="py-2 text-right">25만</td></tr>
            <tr className="border-b border-border"><td className="py-2">5천만~2억</td><td className="py-2 text-right">0.5%</td><td className="py-2 text-right">80만</td></tr>
            <tr className="border-b border-border"><td className="py-2">2~6억</td><td className="py-2 text-right">0.4%</td><td className="py-2 text-right">-</td></tr>
            <tr className="border-b border-border"><td className="py-2">6~9억</td><td className="py-2 text-right">0.5%</td><td className="py-2 text-right">-</td></tr>
            <tr><td className="py-2">9억 이상</td><td className="py-2 text-right">0.9%</td><td className="py-2 text-right">-</td></tr>
          </tbody>
        </table>
      </section>

      <p className="text-[10px] text-text-secondary text-center">2026.03 기준 · 정책 변경 시 업데이트 필요</p>
    </div>
  )
}
