import { useState } from 'react'
import { ToggleLeft, ToggleRight, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react'
import { useFinance } from '../hooks/useFinance.ts'
import { simulate, calcMaxPurchasePrice, calcMonthlyPayment, calcDSR, calcEqualPrincipal, calcEqualPaymentTotalInterest } from '../lib/finance.ts'
import { formatPrice, formatPriceShort } from '../lib/format.ts'
import { nanoid } from 'nanoid'

const RATE_PRESETS = [
  { label: '시중은행 변동', rate: 4.1, desc: 'KB 최저 기준', disabled: false },
  { label: '시중은행 고정', rate: 4.8, desc: 'KB 혼합형', disabled: false },
  { label: '디딤돌 생애최초', rate: 2.7, desc: '소득 7천만↓ · 5억↓', disabled: false },
  { label: '아낌e보금자리론', rate: 4.05, desc: '소득 7천만↓ · 6억↓', disabled: false },
  { label: '보금자리론 일반', rate: 4.35, desc: '소득 7천만↓ · 6억↓', disabled: false },
]

export function SimulatorPage() {
  const {
    config, totalEquity,
    toggleAsset, updateAssetAmount, setLTV, updateConfig,
    addAsset, removeAsset,
  } = useFinance()

  const [priceInput, setPriceInput] = useState(30000) // 만원 단위, 기본 3억
  const [showSettings, setShowSettings] = useState(false)
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [newAssetLabel, setNewAssetLabel] = useState('')
  const [newAssetAmount, setNewAssetAmount] = useState('')

  const result = simulate(priceInput, config)
  const maxPrice = calcMaxPurchasePrice(config)

  function handleAddAsset() {
    if (!newAssetLabel || !newAssetAmount) return
    addAsset({
      id: nanoid(),
      label: newAssetLabel,
      amount: Number(newAssetAmount),
      included: true,
      isVariable: true,
    })
    setNewAssetLabel('')
    setNewAssetAmount('')
    setShowAddAsset(false)
  }

  return (
    <div className="space-y-4">
      {/* 자산 현황 */}
      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">내 자산</h2>
          <span className="text-xs text-text-secondary">
            가용: <span className="font-bold text-primary">{formatPrice(totalEquity)}</span>
          </span>
        </div>

        <div className="space-y-2">
          {config.assets.map(asset => (
            <div key={asset.id} className="flex items-center gap-2">
              <button type="button" onClick={() => toggleAsset(asset.id)} className="shrink-0">
                {asset.included
                  ? <ToggleRight size={24} className="text-primary" />
                  : <ToggleLeft size={24} className="text-border" />
                }
              </button>
              <span className={`text-sm flex-1 ${!asset.included ? 'text-text-secondary line-through' : ''} ${asset.isVariable ? 'italic' : ''}`}>
                {asset.label}
                {asset.isVariable && <span className="text-warning text-[10px] ml-1">변동</span>}
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={asset.amount || ''}
                onChange={e => updateAssetAmount(asset.id, Number(e.target.value))}
                className="w-20 text-right text-sm border border-border rounded px-2 py-1"
              />
              <span className="text-xs text-text-secondary">만</span>
              {!['savings'].includes(asset.id) && (
                <button type="button" onClick={() => removeAsset(asset.id)} className="text-text-secondary hover:text-danger">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {showAddAsset ? (
          <div className="mt-3 flex gap-2 items-center">
            <input
              type="text"
              placeholder="항목명"
              value={newAssetLabel}
              onChange={e => setNewAssetLabel(e.target.value)}
              className="flex-1 text-sm border border-border rounded px-2 py-1"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="만원"
              value={newAssetAmount}
              onChange={e => setNewAssetAmount(e.target.value)}
              className="w-20 text-sm border border-border rounded px-2 py-1"
            />
            <button onClick={handleAddAsset} className="text-xs bg-primary text-white px-2 py-1 rounded">추가</button>
            <button onClick={() => setShowAddAsset(false)} className="text-xs text-text-secondary">취소</button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddAsset(true)}
            className="mt-2 flex items-center gap-1 text-xs text-primary"
          >
            <Plus size={14} /> 자산 항목 추가
          </button>
        )}
      </section>

      {/* LTV 선택 */}
      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">대출 비율 (LTV)</h2>
          <div className="flex bg-bg rounded-lg p-0.5">
            {([70, 80] as const).map(rate => (
              <button
                key={rate}
                onClick={() => setLTV(rate)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  config.ltvRate === rate
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary'
                }`}
              >
                {rate}%
              </button>
            ))}
          </div>
        </div>
        {config.ltvRate === 80 && (
          <p className="text-[11px] text-success">생애최초 + 9억 이하 주택 시 80% 적용 가능</p>
        )}

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-xs text-text-secondary mt-2 underline"
        >
          {showSettings ? '상세 설정 닫기' : '금리/기간 설정'}
        </button>

        {showSettings && (
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            {/* 금리 프리셋 */}
            <div>
              <span className="text-xs text-text-secondary block mb-2">대출 상품별 금리 (2026.03 기준)</span>
              <div className="space-y-1.5">
                {RATE_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => !preset.disabled && updateConfig({ loanInterestRate: preset.rate })}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                      preset.disabled
                        ? 'bg-bg/50 opacity-50 cursor-not-allowed'
                        : config.loanInterestRate === preset.rate
                          ? 'bg-primary/10 ring-1 ring-primary'
                          : 'bg-bg hover:bg-bg/80'
                    }`}
                  >
                    <div>
                      <span className={`font-medium ${preset.disabled ? 'line-through' : ''}`}>{preset.label}</span>
                      <span className={`ml-1 ${preset.disabled ? 'text-danger' : 'text-text-secondary'}`}>{preset.desc}</span>
                    </div>
                    <span className={`font-bold ${preset.disabled ? 'text-text-secondary' : 'text-primary'}`}>{preset.rate}%</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">직접 입력</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={config.loanInterestRate}
                  onChange={e => updateConfig({ loanInterestRate: Number(e.target.value) })}
                  className="w-16 text-right text-sm border border-border rounded px-2 py-1"
                />
                <span className="text-xs">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">대출 기간</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="numeric"
                  value={config.loanTermYears}
                  onChange={e => updateConfig({ loanTermYears: Number(e.target.value) })}
                  className="w-16 text-right text-sm border border-border rounded px-2 py-1"
                />
                <span className="text-xs">년</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">연소득</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="numeric"
                  value={config.annualIncome}
                  onChange={e => updateConfig({ annualIncome: Number(e.target.value) })}
                  className="w-20 text-right text-sm border border-border rounded px-2 py-1"
                />
                <span className="text-xs">만</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 매매가 입력 + 시뮬레이션 결과 */}
      <section className="card p-4">
        <h2 className="font-bold text-sm mb-3">시뮬레이션</h2>

        <div className="mb-4">
          <label className="text-xs text-text-secondary block mb-1">매매가</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={10000}
              max={80000}
              step={500}
              value={priceInput}
              onChange={e => setPriceInput(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <input
              type="number"
              inputMode="numeric"
              value={priceInput}
              onChange={e => setPriceInput(Number(e.target.value))}
              className="w-20 text-right text-sm border border-border rounded px-2 py-1"
            />
            <span className="text-xs text-text-secondary">만</span>
          </div>
          <div className="text-right text-lg font-bold text-primary mt-1">
            {formatPriceShort(priceInput)}
          </div>
        </div>

        {/* 결과 */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">대출금</span>
            <span className="font-medium">{formatPrice(result.loanAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">자기부담금</span>
            <span className="font-medium">{formatPrice(result.equityNeeded)}</span>
          </div>
          <div className="border-t border-border my-2" />
          <div className="flex justify-between">
            <span className="text-text-secondary">취득세</span>
            <span>{formatPrice(result.acquisitionTax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">중개수수료</span>
            <span>{formatPrice(result.brokerageFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">이사비+기타</span>
            <span>{formatPrice(config.movingCost + config.etcCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">법무사</span>
            <span>{formatPrice(60)}</span>
          </div>
          <div className="border-t border-border my-2" />
          <div className="flex justify-between font-bold">
            <span>필요 총액</span>
            <span>{formatPrice(result.totalNeeded)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>내 자금</span>
            <span className="text-primary">{formatPrice(result.availableEquity)}</span>
          </div>

          {/* 과부족 */}
          <div className={`flex justify-between items-center font-bold text-base p-3 rounded-lg ${
            result.gap >= 0 ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'
          }`}>
            <span className="flex items-center gap-1">
              {result.gap >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {result.gap >= 0 ? '여유' : '부족'}
            </span>
            <span>{result.gap >= 0 ? '+' : ''}{formatPrice(Math.abs(result.gap))}</span>
          </div>

          {/* 상환 방식 + 기간별 비교 */}
          <div className="border-t border-border my-2" />
          <p className="text-xs font-bold mb-1">상환 방식 · 기간별 비교</p>
          <p className="text-[10px] text-text-secondary mb-3">대출금 {formatPrice(result.loanAmount)} · 금리 {config.loanInterestRate}%</p>

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left text-text-secondary font-normal">기간</th>
                <th className="pb-2 text-center text-text-secondary font-normal">원리금균등</th>
                <th className="pb-2 text-center text-text-secondary font-normal">원금균등</th>
              </tr>
            </thead>
            <tbody>
              {[20, 30, 40].map(years => {
                const ep = calcMonthlyPayment(result.loanAmount, config.loanInterestRate, years)
                const epInterest = calcEqualPaymentTotalInterest(result.loanAmount, config.loanInterestRate, years)
                const epDsr = calcDSR(ep, config.annualIncome)
                const eq = calcEqualPrincipal(result.loanAmount, config.loanInterestRate, years)
                const eqDsr = calcDSR(eq.first, config.annualIncome)
                const isSelected = config.loanTermYears === years
                return (
                  <tr key={years} className={`border-b border-border ${isSelected ? 'bg-primary/5' : ''}`}>
                    <td className="py-2.5">
                      <span className={`font-medium ${isSelected ? 'text-primary' : ''}`}>{years}년</span>
                    </td>
                    <td className="py-2.5 text-center">
                      <p className="font-bold">{ep.toLocaleString()}만</p>
                      <p className={`text-[10px] ${epDsr > 40 ? 'text-danger' : 'text-text-secondary'}`}>
                        DSR {epDsr}%{epDsr > 40 ? ' ❌' : ''}
                      </p>
                      <p className="text-[10px] text-text-secondary">이자 {formatPrice(epInterest)}</p>
                    </td>
                    <td className="py-2.5 text-center">
                      <p className="font-bold">{eq.first.toLocaleString()}만</p>
                      <p className="text-[10px] text-text-secondary">→ {eq.last.toLocaleString()}만</p>
                      <p className={`text-[10px] ${eqDsr > 40 ? 'text-danger' : 'text-text-secondary'}`}>
                        DSR {eqDsr}%{eqDsr > 40 ? ' ❌' : ''}
                      </p>
                      <p className="text-[10px] text-text-secondary">이자 {formatPrice(eq.totalInterest)}</p>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="mt-3 p-2 bg-bg rounded-lg text-[10px] text-text-secondary space-y-0.5">
            <p><strong>원리금균등:</strong> 매월 동일한 금액 상환. 초반 이자 비중 높음</p>
            <p><strong>원금균등:</strong> 매월 원금 동일 + 이자 점차 감소. 초반 부담 크지만 총 이자 적음</p>
          </div>

          <div className="border-t border-border my-2" />
          <div className="flex justify-between">
            <span className="text-text-secondary">현재 설정 ({config.loanTermYears}년 원리금균등)</span>
            <span className="font-bold text-primary">월 {result.monthlyPayment.toLocaleString()}만원</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">DSR</span>
            <span className={result.dsr > 40 ? 'text-danger font-bold' : ''}>
              {result.dsr}%
              {result.dsr > 40 && ' (한도 초과!)'}
            </span>
          </div>
        </div>
      </section>

      {/* 최대 매수 가능 */}
      <section className="card p-4 bg-primary/5 border-primary/20">
        <div className="text-center">
          <p className="text-xs text-text-secondary mb-1">현재 설정 기준 최대 매수 가능 금액</p>
          <p className="text-2xl font-bold text-primary">{formatPriceShort(maxPrice)}</p>
          <p className="text-[11px] text-text-secondary mt-1">
            LTV {config.ltvRate}% · 금리 {config.loanInterestRate}% · {config.loanTermYears}년
          </p>
        </div>
      </section>
    </div>
  )
}
