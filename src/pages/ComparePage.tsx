import { useState } from 'react'
import { Check } from 'lucide-react'
import type { Property } from '../types/property.ts'
import type { FinanceConfig } from '../types/finance.ts'
import { formatPrice } from '../lib/format.ts'
import { getMoveInStatus } from '../lib/format.ts'
import { simulate, calcAcquisitionTax } from '../lib/finance.ts'
import { calcScore, DEFAULT_WEIGHTS, getRegionLTV, canFirstTimeDiscount } from '../lib/score.ts'
import { ScoreBar } from '../components/ScoreBar.tsx'

interface Props {
  properties: Property[]
  financeConfig: FinanceConfig
}

export function ComparePage({ properties, financeConfig }: Props) {
  const [selected, setSelected] = useState<string[]>([])

  function toggleSelect(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const comparing = properties.filter(p => selected.includes(p.id))

  if (properties.length < 2) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">📊</p>
        <p className="text-text-secondary text-sm">매물을 2개 이상 등록하면</p>
        <p className="text-text-secondary text-sm">비교할 수 있어요</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 매물 선택 */}
      <section className="card p-4">
        <h2 className="font-bold text-sm mb-2">비교할 매물 선택 (최대 3개)</h2>
        <div className="space-y-2">
          {properties.map(p => {
            const moveIn = getMoveInStatus(p.moveInDate)
            return (
              <button
                key={p.id}
                onClick={() => toggleSelect(p.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                  selected.includes(p.id) ? 'bg-primary/10 border border-primary/30' : 'bg-bg'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                  selected.includes(p.id) ? 'bg-primary border-primary' : 'border-border'
                }`}>
                  {selected.includes(p.id) && <Check size={12} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {p.rank != null && (
                      <span className="text-[10px] font-bold text-primary">{p.rank}순위</span>
                    )}
                    <span className="text-sm font-medium truncate">{p.basic.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] px-1 py-0.5 rounded bg-bg text-text-secondary">{p.basic.propertyType}</span>
                    <span className={`text-[10px] px-1 py-0.5 rounded ${moveIn.ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {moveIn.label}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-primary font-bold shrink-0">{formatPrice(p.basic.price)}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 비교 테이블 */}
      {comparing.length >= 2 && (
        <>
          {/* 핵심 비교 */}
          <section className="card overflow-x-auto">
            <div className="p-3 border-b border-border">
              <h3 className="font-bold text-sm">핵심 비교</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-2 text-left text-xs text-text-secondary font-normal w-20"></th>
                  {comparing.map(p => (
                    <th key={p.id} className="p-2 text-center text-xs">
                      <span className="font-bold">{p.basic.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="순위" values={comparing.map(p => p.rank != null ? `${p.rank}순위` : '-')}
                  best={findBestIdx(comparing.map(p => p.rank ?? 99), 'min')} />
                <CompareRow label="7월 입주" values={comparing.map(p => {
                  const s = getMoveInStatus(p.moveInDate)
                  return s.ok ? '가능' : '불가'
                })} highlights={comparing.map(p => getMoveInStatus(p.moveInDate).ok ? 'success' : 'danger')} />
                <CompareRow label="유형" values={comparing.map(p => p.basic.propertyType)} />
                <CompareRow label="매매가" values={comparing.map(p => formatPrice(p.basic.price))}
                  best={findBestIdx(comparing.map(p => p.basic.price), 'min')} />
                <CompareRow label="평수" values={comparing.map(p => `${p.basic.pyeong}평`)}
                  best={findBestIdx(comparing.map(p => p.basic.pyeong), 'max')} />
                <CompareRow label="방/향" values={comparing.map(p => `${p.basic.rooms}룸 ${p.basic.direction}`)} />
                <CompareRow label="년차" values={comparing.map(p => `${new Date().getFullYear() - p.basic.buildYear + 1}년`)} />
              </tbody>
            </table>
          </section>

          {/* 교통 비교 */}
          <section className="card overflow-x-auto">
            <div className="p-3 border-b border-border">
              <h3 className="font-bold text-sm">교통</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-2 text-left text-xs text-text-secondary font-normal w-20"></th>
                  {comparing.map(p => (
                    <th key={p.id} className="p-2 text-center text-xs font-bold">{p.basic.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="가까운 역" values={comparing.map(p =>
                  p.living.stationName ? `${p.living.stationName.split('(')[0].trim()} ${p.living.stationMinutes}분` : '-'
                )} best={findBestIdx(comparing.map(p => p.living.stationMinutes ?? 99), 'min')} />
                {(() => {
                  const destinations = new Set<string>()
                  comparing.forEach(p => (p.commutes ?? []).forEach(c => { if (c.duration) destinations.add(c.destination) }))
                  return Array.from(destinations).map(dest => (
                    <CompareRow key={dest} label={dest.replace('회사 (퍼시스 오금역)', '회사').replace('강남역', '강남')}
                      values={comparing.map(p => {
                        const c = (p.commutes ?? []).find(c => c.destination === dest)
                        return c?.duration || '-'
                      })} />
                  ))
                })()}
              </tbody>
            </table>
          </section>

          {/* 비용 비교 */}
          <section className="card overflow-x-auto">
            <div className="p-3 border-b border-border">
              <h3 className="font-bold text-sm">비용</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-2 text-left text-xs text-text-secondary font-normal w-20"></th>
                  {comparing.map(p => (
                    <th key={p.id} className="p-2 text-center text-xs font-bold">{p.basic.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="LTV" values={comparing.map(p => `${getRegionLTV(p.basic.address)}%`)}
                  best={findBestIdx(comparing.map(p => getRegionLTV(p.basic.address)), 'max')} />
                <CompareRow label="취득세율" values={comparing.map(p =>
                  p.basic.propertyType === '오피스텔' ? '4.6%' : '1.1%'
                )} best={findBestIdx(comparing.map(p => p.basic.propertyType === '오피스텔' ? 4.6 : 1.1), 'min')} />
                <CompareRow label="취득세액" values={comparing.map(p => {
                  if (p.basic.propertyType === '오피스텔') return formatPrice(Math.round(p.basic.price * 0.046))
                  const tax = calcAcquisitionTax(p.basic.price, true)
                  return formatPrice(tax)
                })} best={findBestIdx(comparing.map(p => {
                  if (p.basic.propertyType === '오피스텔') return p.basic.price * 0.046
                  return calcAcquisitionTax(p.basic.price, true)
                }), 'min')} />
                <CompareRow label="감면" values={comparing.map(p =>
                  canFirstTimeDiscount(p.basic.propertyType) ? '-200만' : '없음'
                )} />
                {(() => {
                  const sims = comparing.map(p => simulate(p.basic.price, financeConfig))
                  return (
                    <>
                      <CompareRow label="대출금" values={sims.map(s => formatPrice(s.loanAmount))} />
                      <CompareRow label="월 상환" values={sims.map(s => `${s.monthlyPayment}만`)}
                        best={findBestIdx(sims.map(s => s.monthlyPayment), 'min')} />
                      <CompareRow label="DSR" values={sims.map(s => `${s.dsr}%`)}
                        highlights={sims.map(s => s.dsr > 40 ? 'danger' : undefined)} />
                      <CompareRow label="여유/부족" values={sims.map(s =>
                        `${s.gap >= 0 ? '+' : ''}${formatPrice(Math.abs(s.gap))}`
                      )} highlights={sims.map(s => s.gap >= 0 ? 'success' : 'danger')} />
                    </>
                  )
                })()}
              </tbody>
            </table>
          </section>

          {/* 미래가치 */}
          <section className="card overflow-x-auto">
            <div className="p-3 border-b border-border">
              <h3 className="font-bold text-sm">미래가치</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-2 text-left text-xs text-text-secondary font-normal w-20"></th>
                  {comparing.map(p => (
                    <th key={p.id} className="p-2 text-center text-xs font-bold">{p.basic.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="유형" values={comparing.map(p => p.basic.propertyType)}
                  best={findBestIdx(comparing.map(p =>
                    p.basic.propertyType === '아파트' ? 3 : p.basic.propertyType === '주상복합' ? 2 : 1
                  ), 'max')} />
                <CompareRow label="재건축" values={comparing.map(p => {
                  const age = new Date().getFullYear() - p.basic.buildYear + 1
                  if (p.basic.propertyType !== '아파트') return '해당없음'
                  if (age >= 30) return '가능성 높음'
                  if (age >= 20) return '향후 기대'
                  return '아직 먼 미래'
                })} />
                <CompareRow label="개발호재" values={comparing.map(p =>
                  p.investment.development ? p.investment.development.slice(0, 20) + (p.investment.development.length > 20 ? '...' : '') : '-'
                )} />
                <CompareRow label="전세가율" values={comparing.map(p =>
                  p.investment.jeonseRate ? `${p.investment.jeonseRate}%` : '-'
                )} />
              </tbody>
            </table>
          </section>

          {/* 종합 점수 */}
          <section className="card p-4">
            <h3 className="font-bold text-sm mb-3">종합 점수</h3>
            <div className="space-y-4">
              {comparing
                .map(p => ({ p, s: calcScore(p, financeConfig, DEFAULT_WEIGHTS) }))
                .sort((a, b) => b.s.total - a.s.total)
                .map(({ p, s }) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{p.basic.name}</span>
                      {p.rank != null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{p.rank}순위</span>
                      )}
                    </div>
                    <span className="text-xl font-bold text-primary">{s.total}점</span>
                  </div>
                  <div className="space-y-1">
                    <ScoreBar label="교통/입지" score={s.location} color="bg-accent" />
                    <ScoreBar label="실거주" score={s.condition} color="bg-secondary" />
                    <ScoreBar label="미래가치" score={s.investment} color="bg-warning" />
                    <ScoreBar label="비용효율" score={s.cost} color="bg-success" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 p-2 bg-bg rounded-lg text-[10px] text-text-secondary space-y-0.5">
              <p><strong>교통/입지 35%:</strong> 회사·강남 출퇴근, 역세권</p>
              <p><strong>미래가치 25%:</strong> 아파트&gt;오피스텔, 재건축, 개발호재</p>
              <p><strong>실거주 20%:</strong> 평수, 방 분리, 향, 채광</p>
              <p><strong>비용효율 20%:</strong> 취득세, LTV, 자금 여유</p>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function CompareRow({ label, values, best, highlights }: {
  label: string
  values: string[]
  best?: number
  highlights?: (string | undefined)[]
}) {
  return (
    <tr className="border-b border-border">
      <td className="p-2 text-xs text-text-secondary">{label}</td>
      {values.map((v, i) => {
        const hl = highlights?.[i]
        const isBest = i === best
        let cls = 'p-2 text-center text-xs '
        if (hl === 'success') cls += 'font-bold text-success'
        else if (hl === 'danger') cls += 'font-bold text-danger'
        else if (isBest) cls += 'font-bold text-primary bg-primary/5'
        return <td key={i} className={cls}>{v}</td>
      })}
    </tr>
  )
}

function findBestIdx(values: number[], mode: 'min' | 'max'): number | undefined {
  if (values.length === 0) return undefined
  const allSame = values.every(v => v === values[0])
  if (allSame) return undefined
  const target = mode === 'min' ? Math.min(...values) : Math.max(...values)
  return values.indexOf(target)
}
