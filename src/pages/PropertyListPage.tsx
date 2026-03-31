import { useState, useMemo } from 'react'
import { Plus, Star, MapPin, ArrowUpDown, ClipboardCheck } from 'lucide-react'
import type { Property } from '../types/property.ts'
import { formatPrice, getMoveInStatus } from '../lib/format.ts'

type SortKey = 'recent' | 'price-asc' | 'price-desc' | 'rating' | 'rank'

function extractRegion(address: string): string {
  const parts = address.split(/\s+/)
  // "경기도 구리시 ..." → "구리시", "서울시 강남구 ..." → "강남구"
  return parts[1] || '기타'
}

interface Props {
  properties: Property[]
  onAdd: () => void
  onSelect: (id: string) => void
  onFieldCheck: (id: string) => void
}

export function PropertyListPage({ properties, onAdd, onSelect, onFieldCheck }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [regionFilter, setRegionFilter] = useState<string>('전체')

  const regions = useMemo(() => {
    const set = new Set(properties.map(p => extractRegion(p.basic.address)))
    return ['전체', ...Array.from(set).sort()]
  }, [properties])

  const filtered = regionFilter === '전체'
    ? properties
    : properties.filter(p => extractRegion(p.basic.address) === regionFilter)

  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'price-asc': return a.basic.price - b.basic.price
      case 'price-desc': return b.basic.price - a.basic.price
      case 'rating': return b.rating - a.rating
      case 'rank': {
        const aRank = a.rank ?? Infinity
        const bRank = b.rank ?? Infinity
        return aRank - bRank
      }
      default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  if (properties.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">🏠</p>
        <p className="text-text-secondary text-sm mb-4">아직 등록된 매물이 없습니다</p>
        <p className="text-text-secondary text-xs mb-6">집 보러 가서 기록해보세요!</p>
        <button
          onClick={onAdd}
          className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium"
        >
          매물 등록하기
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* 지역 필터 */}
      {regions.length > 2 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {regions.map(r => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                regionFilter === r
                  ? 'bg-primary text-white'
                  : 'bg-bg text-text-secondary border border-border'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* 정렬 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-text-secondary">{sorted.length}개 매물</span>
        <div className="flex items-center gap-1">
          <ArrowUpDown size={14} className="text-text-secondary" />
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
            className="text-xs border-none bg-transparent text-text-secondary"
          >
            <option value="recent">최근 등록</option>
            <option value="price-asc">가격 낮은순</option>
            <option value="price-desc">가격 높은순</option>
            <option value="rank">내 순위순</option>
            <option value="rating">평점 높은순</option>
          </select>
        </div>
      </div>

      {/* 매물 목록 */}
      <div className="space-y-3">
        {sorted.map(p => (
          <div key={p.id} className="card p-4">
            <button
              onClick={() => onSelect(p.id)}
              className="w-full text-left"
            >
              <div className="flex gap-3">
                {/* 썸네일 */}
                <div className="relative w-20 h-20 rounded-lg bg-bg flex items-center justify-center shrink-0 overflow-hidden">
                  {p.photos.length > 0
                    ? <img src={p.photos[0]} alt="" className="w-full h-full object-cover" />
                    : <span className="text-2xl">🏢</span>
                  }
                  {p.rank != null && (
                    <span className={`absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow ${
                      p.rank === 1 ? 'bg-yellow-500' : p.rank === 2 ? 'bg-gray-400' : p.rank === 3 ? 'bg-amber-700' : 'bg-primary'
                    }`}>
                      {p.rank}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {p.basic.propertyType && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium shrink-0">{p.basic.propertyType}</span>
                      )}
                      <h3 className="font-bold text-sm truncate">{p.basic.name || '이름 없음'}</h3>
                    </div>
                    {p.rating > 0 && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Star size={12} className="text-warning fill-warning" />
                        <span className="text-xs font-medium">{p.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-lg font-bold text-primary">{p.basic.price > 0 ? formatPrice(p.basic.price) : '-'}</p>
                    {p.investment.jeonsePrice != null && p.investment.jeonsePrice > 0 && (
                      <p className="text-sm font-medium text-accent">전세 {formatPrice(p.investment.jeonsePrice)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <MapPin size={10} />
                      <span className="truncate">{p.basic.address || '주소 미입력'}</span>
                    </div>
                    {(() => {
                      const s = getMoveInStatus(p.moveInDate)
                      return (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                          s.ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                        }`}>{s.label}</span>
                      )
                    })()}
                  </div>
                  <div className="flex gap-2 text-[11px] text-text-secondary mt-1">
                    <span>{p.basic.pyeong}평</span>
                    <span>{p.basic.floor}/{p.basic.totalFloors}층</span>
                    <span>{p.basic.direction}</span>
                    <span>{new Date().getFullYear() - p.basic.buildYear + 1}년차</span>
                    {p.basic.maintenanceFee > 0 && <span>관리비 {p.basic.maintenanceFee}만</span>}
                  </div>
                </div>
              </div>
            </button>

            {/* 임장 체크 버튼 */}
            <div className="mt-2 pt-2 border-t border-border">
              <button
                onClick={() => onFieldCheck(p.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  p.fieldCheck
                    ? 'bg-success/10 text-success'
                    : 'bg-bg text-text-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={16} />
                  <span className="font-medium">{p.fieldCheck ? '임장 체크 완료' : '임장 체크하기'}</span>
                </div>
                <span className="text-xs">{p.fieldCheck ? '수정 →' : '체크 →'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={onAdd}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-10"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
