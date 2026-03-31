import { ArrowLeft, Edit, Trash2, Star, MapPin, ExternalLink, Phone, Train, Trophy } from 'lucide-react'
import type { Property } from '../types/property.ts'
import type { FinanceConfig } from '../types/finance.ts'
import { formatPrice, getMoveInStatus, MOVE_TARGET } from '../lib/format.ts'
import { simulate } from '../lib/finance.ts'
import { calcScore, DEFAULT_WEIGHTS } from '../lib/score.ts'
import { ScoreBar } from '../components/ScoreBar.tsx'

interface Props {
  property: Property
  financeConfig: FinanceConfig
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onRankChange: (rank: number | null) => void
}

function RatingBar({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const pct = (value / 5) * 100
  const color = invert
    ? value <= 2 ? 'bg-success' : value <= 3 ? 'bg-warning' : 'bg-danger'
    : value >= 4 ? 'bg-success' : value >= 3 ? 'bg-primary' : 'bg-warning'
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-secondary w-14 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-bg rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-4 text-right">{value}</span>
    </div>
  )
}

const RANK_OPTIONS = [1, 2, 3, 4, 5] as const

export function PropertyDetailPage({ property, financeConfig, onBack, onEdit, onDelete, onRankChange }: Props) {
  const { basic, living, investment } = property
  const sim = simulate(basic.price, financeConfig)
  const score = calcScore(property, financeConfig, DEFAULT_WEIGHTS)
  const buildAge = new Date().getFullYear() - basic.buildYear + 1

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-text-secondary">
          <ArrowLeft size={16} /> 목록
        </button>
        <div className="flex gap-2">
          <button onClick={onEdit} className="flex items-center gap-1 text-sm text-primary">
            <Edit size={14} /> 수정
          </button>
          <button onClick={() => { if (confirm('삭제하시겠습니까?')) onDelete() }}
            className="flex items-center gap-1 text-sm text-danger">
            <Trash2 size={14} /> 삭제
          </button>
        </div>
      </div>

      {/* 사진 */}
      {property.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {property.photos.map((photo, i) => (
            <img key={i} src={photo} alt="" className="w-40 h-28 rounded-lg object-cover shrink-0" />
          ))}
        </div>
      )}

      {/* 기본 정보 */}
      <div className="card p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {basic.propertyType && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium shrink-0">{basic.propertyType}</span>
              )}
              <h2 className="font-bold text-lg">{basic.name || '이름 없음'}</h2>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
              <MapPin size={10} />
              <span>{basic.address || '주소 미입력'}</span>
            </div>
          </div>
          {property.rating > 0 && (
            <div className="flex items-center gap-0.5">
              <Star size={16} className="text-warning fill-warning" />
              <span className="font-bold">{property.rating}</span>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-3 mt-2">
          <div>
            <span className="text-[10px] text-text-secondary">매매</span>
            <p className="text-2xl font-bold text-primary">{basic.price > 0 ? formatPrice(basic.price) : '-'}</p>
          </div>
          {investment.jeonsePrice != null && investment.jeonsePrice > 0 && (
            <div>
              <span className="text-[10px] text-text-secondary">전세</span>
              <p className="text-xl font-bold text-accent">{formatPrice(investment.jeonsePrice)}</p>
            </div>
          )}
          {investment.jeonseRate != null && investment.jeonseRate > 0 && (
            <span className="text-xs text-text-secondary self-end mb-1">전세가율 {investment.jeonseRate}%</span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3 text-center">
          <div className="bg-bg rounded-lg py-2">
            <p className="text-xs text-text-secondary">평수</p>
            <p className="font-bold text-sm">{basic.pyeong}평</p>
          </div>
          <div className="bg-bg rounded-lg py-2">
            <p className="text-xs text-text-secondary">층</p>
            <p className="font-bold text-sm">{basic.floor}/{basic.totalFloors}</p>
          </div>
          <div className="bg-bg rounded-lg py-2">
            <p className="text-xs text-text-secondary">방향</p>
            <p className="font-bold text-sm">{basic.direction}</p>
          </div>
          <div className="bg-bg rounded-lg py-2">
            <p className="text-xs text-text-secondary">관리비</p>
            <p className="font-bold text-sm">{basic.maintenanceFee}만</p>
          </div>
        </div>

        <div className="flex gap-4 text-xs text-text-secondary mt-2">
          <span>준공 {basic.buildYear}년 ({buildAge}년차)</span>
          <span>{basic.rooms}룸 / {basic.bathrooms}화장실</span>
          <span>전용 {basic.sizeM2}m²</span>
        </div>

        {/* 입주 가능 여부 */}
        {(() => {
          const s = getMoveInStatus(property.moveInDate)
          return (
            <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
              s.ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            }`}>
              <span>{s.ok ? '7월 말 이사 가능' : '7월 말 이사 불가'}</span>
              <span className="text-xs font-normal">{s.label}</span>
            </div>
          )
        })()}
      </div>

      {/* 내 순위 */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            <Trophy size={14} className="text-warning" /> 내 순위
          </h3>
          <div className="flex gap-1.5">
            {RANK_OPTIONS.map(r => (
              <button
                key={r}
                onClick={() => onRankChange(property.rank === r ? null : r)}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                  property.rank === r
                    ? r === 1 ? 'bg-yellow-500 text-white' : r === 2 ? 'bg-gray-400 text-white' : r === 3 ? 'bg-amber-700 text-white' : 'bg-primary text-white'
                    : 'bg-bg text-text-secondary border border-border'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 중개사 정보 + 전화하기 */}
      {property.agent && (property.agent.name || property.agent.phone) ? (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">중개사</h3>
              <p className="text-sm mt-0.5">{property.agent.name}</p>
              {property.agent.phone && <p className="text-xs text-text-secondary">{property.agent.phone}</p>}
              {property.agent.memo && <p className="text-xs text-text-secondary">{property.agent.memo}</p>}
            </div>
            {property.agent.phone && (
              <a
                href={`tel:${property.agent.phone.replace(/[^0-9+]/g, '')}`}
                className="flex items-center gap-1.5 bg-success text-white px-5 py-3 rounded-xl text-sm font-bold shrink-0 shadow-sm"
              >
                <Phone size={18} />
                전화하기
              </a>
            )}
          </div>
        </div>
      ) : (
        <button onClick={onEdit} className="card p-4 w-full text-left">
          <div className="flex items-center justify-between text-text-secondary">
            <div className="flex items-center gap-2">
              <Phone size={16} />
              <span className="text-sm">중개사 정보를 등록하세요</span>
            </div>
            <span className="text-xs text-primary">등록하기 →</span>
          </div>
        </button>
      )}

      {/* 출퇴근/교통 — 기본 정보 바로 아래로 올림 */}
      {property.commutes && property.commutes.length > 0 && property.commutes.some(c => c.duration) && (
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5">
            <Train size={14} className="text-primary" /> 출퇴근
          </h3>
          <div className="space-y-3">
            {living.stationName && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-secondary">가까운 역</p>
                  <p className="text-sm font-medium">{living.stationName}</p>
                </div>
                <span className="text-primary font-bold text-sm">도보 {living.stationMinutes}분</span>
              </div>
            )}
            {property.commutes.filter(c => c.duration).map((c, i) => (
              <div key={i} className="bg-bg rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">{c.destination}</span>
                  <span className="text-primary font-bold text-sm">{c.duration}</span>
                </div>
                <p className="text-xs text-text-secondary">{c.route}</p>
                <div className="flex gap-3 text-[11px] text-text-secondary mt-1">
                  {c.distance && <span>{c.distance}</span>}
                  {c.transfers > 0 && <span>환승 {c.transfers}회</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 자금 시뮬레이션 */}
      <div className={`card p-4 ${sim.feasible ? 'border-success/30' : 'border-danger/30'}`}>
        <h3 className="font-bold text-sm mb-2">이 집 사면?</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">대출금</span>
            <span>{formatPrice(sim.loanAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">필요 총액</span>
            <span>{formatPrice(sim.totalNeeded)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">월 상환액</span>
            <span className="font-bold">월 {sim.monthlyPayment.toLocaleString()}만원</span>
          </div>
          <div className={`flex justify-between font-bold ${sim.gap >= 0 ? 'text-success' : 'text-danger'}`}>
            <span>{sim.gap >= 0 ? '여유' : '부족'}</span>
            <span>{sim.gap >= 0 ? '+' : ''}{formatPrice(Math.abs(sim.gap))}</span>
          </div>
        </div>
      </div>

      {/* 생활환경 — 바 그래프로 변경 */}
      <div className="card p-4">
        <h3 className="font-bold text-sm mb-3">생활환경</h3>
        {living.stationName && (
          <div className="bg-bg rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
            <span className="text-xs text-text-secondary">역세권</span>
            <span className="text-sm font-medium">{living.stationName} 도보 {living.stationMinutes}분</span>
          </div>
        )}
        <div className="space-y-2.5">
          <RatingBar label="편의시설" value={living.convenience} />
          <RatingBar label="학군" value={living.school} />
          <RatingBar label="소음" value={living.noise} invert />
          <RatingBar label="주차" value={living.parking} />
          <RatingBar label="채광" value={living.sunlight} />
          <RatingBar label="조망" value={living.view} />
        </div>
      </div>

      {/* 투자 관점 — 세로 레이아웃으로 변경 */}
      {(investment.jeonsePrice || investment.priceChange || investment.development) && (
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-3">투자 관점</h3>
          <div className="space-y-3">
            {investment.jeonsePrice && (
              <div>
                <p className="text-xs text-text-secondary mb-0.5">전세가 / 전세가율</p>
                <p className="text-sm">{formatPrice(investment.jeonsePrice)} ({investment.jeonseRate}%)</p>
              </div>
            )}
            {investment.priceChange && (
              <div>
                <p className="text-xs text-text-secondary mb-0.5">시세 변동</p>
                <p className="text-sm">{investment.priceChange}</p>
              </div>
            )}
            {investment.development && (
              <div>
                <p className="text-xs text-text-secondary mb-0.5">개발 호재</p>
                <p className="text-sm">{investment.development}</p>
              </div>
            )}
            {investment.gapInvestPossible && (
              <div className="text-xs text-success font-medium mt-1">갭투자 가능</div>
            )}
          </div>
        </div>
      )}

      {/* 임장 체크 */}
      {property.fieldCheck ? (
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-3">임장 체크</h3>
          <p className="text-[11px] text-text-secondary mb-2 font-medium">집 안</p>
          <div className="space-y-2.5">
            <RatingBar label="수리 상태" value={property.fieldCheck.condition} />
            <RatingBar label="배관/녹물" value={property.fieldCheck.plumbing ?? 3} />
            <RatingBar label="누수/곰팡이/결로" value={property.fieldCheck.waterLeak} />
            <RatingBar label="수압/배수" value={property.fieldCheck.waterPressure} />
            <RatingBar label="냄새" value={property.fieldCheck.smell} />
          </div>
          <p className="text-[11px] text-text-secondary mb-2 mt-4 font-medium">건물/단지</p>
          <div className="space-y-2.5">
            <RatingBar label="엘리베이터" value={property.fieldCheck.elevator} />
            <RatingBar label="방음/복도소음" value={property.fieldCheck.soundproof} />
            <RatingBar label="주차 실제상태" value={property.fieldCheck.parkingReal ?? 3} />
            <RatingBar label="보안" value={property.fieldCheck.security ?? 3} />
            <RatingBar label="건물관리" value={property.fieldCheck.buildingMgmt ?? 3} />
          </div>
          <div className="flex flex-wrap gap-2 mt-3 text-xs">
            {property.fieldCheck.balconyExpanded && (
              <span className="px-2 py-1 rounded-full bg-success/10 text-success font-medium">베란다 확장</span>
            )}
            {property.fieldCheck.boilerOld && (
              <span className="px-2 py-1 rounded-full bg-danger/10 text-danger font-medium">보일러 노후</span>
            )}
            {property.fieldCheck.asbestosSuspect && (
              <span className="px-2 py-1 rounded-full bg-danger/10 text-danger font-medium">석면 의심</span>
            )}
            {property.fieldCheck.visitedNight && (
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">야간 방문 완료</span>
            )}
            {!property.fieldCheck.visitedNight && (
              <span className="px-2 py-1 rounded-full bg-warning/10 text-warning font-medium">야간 미방문</span>
            )}
          </div>
          {property.fieldCheck.fieldMemo && (
            <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">{property.fieldCheck.fieldMemo}</p>
          )}
        </div>
      ) : (
        <button onClick={onEdit} className="card p-4 w-full text-left">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-sm">임장 가서 체크해보세요</span>
            <span className="text-xs text-primary">체크하기 →</span>
          </div>
        </button>
      )}

      {/* 종합 점수 */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">종합 점수</h3>
          <span className="text-2xl font-bold text-primary">{score.total}</span>
        </div>
        <div className="space-y-2">
          <ScoreBar label="교통/입지" score={score.location} color="bg-accent" />
          <ScoreBar label="실거주" score={score.condition} color="bg-secondary" />
          <ScoreBar label="미래가치" score={score.investment} color="bg-warning" />
          <ScoreBar label="비용효율" score={score.cost} color="bg-success" />
        </div>
      </div>

      {/* 링크 */}
      {property.links && property.links.length > 0 && (
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-2">관련 링크</h3>
          <div className="space-y-2">
            {property.links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline">
                <ExternalLink size={14} />
                {link.label || link.url}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 메모 */}
      {property.memo && (
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-2">메모</h3>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{property.memo}</p>
        </div>
      )}

      <p className="text-[11px] text-text-secondary text-center">
        방문일: {property.visitDate} · 등록: {property.createdAt.slice(0, 10)}
      </p>
    </div>
  )
}
