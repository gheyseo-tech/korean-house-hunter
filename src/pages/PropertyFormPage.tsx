import { useState } from 'react'
import { ChevronDown, ChevronUp, Camera, X, ArrowLeft, Save, Plus, Link, Trash2 } from 'lucide-react'
import { StarRating } from '../components/StarRating.tsx'
import type { Property, Direction, AgentInfo, PropertyType, FieldCheck } from '../types/property.ts'

const DEFAULT_FIELD_CHECK: FieldCheck = {
  condition: 3, waterLeak: 3, soundproof: 3, waterPressure: 3,
  smell: 3, balconyExpanded: false, elevator: 3, surroundings: 3,
  visitedNight: false, fieldMemo: '',
}
import { m2ToPyeong, pyeongToM2 } from '../lib/format.ts'

type PropertyData = Omit<Property, 'id' | 'createdAt' | 'updatedAt'>

interface Props {
  initial: PropertyData
  onSave: (data: PropertyData) => void
  onCancel: () => void
  isEdit?: boolean
}

const DIRECTIONS: Direction[] = ['동', '서', '남', '북', '남동', '남서', '북동', '북서']
const PROPERTY_TYPES: PropertyType[] = ['아파트', '오피스텔', '주상복합', '빌라', '기타']

function RatingRow({ label, value, onChange, invert }: { label: string; value: number; onChange: (v: number) => void; invert?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
              n === value
                ? invert ? 'bg-danger text-white' : 'bg-primary text-white'
                : 'bg-bg text-text-secondary'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export function PropertyFormPage({ initial, onSave, onCancel, isEdit }: Props) {
  const [data, setData] = useState<PropertyData>(initial)
  const [openSections, setOpenSections] = useState({ basic: true, living: false, commute: false, invest: false, fieldCheck: false, record: false })

  function toggle(section: keyof typeof openSections) {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  function updateBasic<K extends keyof PropertyData['basic']>(key: K, value: PropertyData['basic'][K]) {
    setData(prev => {
      const basic = { ...prev.basic, [key]: value }
      // m² ↔ 평 자동 변환
      if (key === 'sizeM2') basic.pyeong = m2ToPyeong(value as number)
      if (key === 'pyeong') basic.sizeM2 = pyeongToM2(value as number)
      return { ...prev, basic }
    })
  }

  function updateLiving<K extends keyof PropertyData['living']>(key: K, value: PropertyData['living'][K]) {
    setData(prev => ({ ...prev, living: { ...prev.living, [key]: value } }))
  }

  function updateInvest<K extends keyof PropertyData['investment']>(key: K, value: PropertyData['investment'][K]) {
    setData(prev => {
      const investment = { ...prev.investment, [key]: value }
      // 전세가율 자동 계산
      if ((key === 'jeonsePrice') && prev.basic.price > 0 && investment.jeonsePrice) {
        investment.jeonseRate = Math.round(investment.jeonsePrice / prev.basic.price * 1000) / 10
      }
      return { ...prev, investment }
    })
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return

    Array.from(files).slice(0, 5 - data.photos.length).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxW = 800
          const scale = Math.min(1, maxW / img.width)
          canvas.width = img.width * scale
          canvas.height = img.height * scale
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const resized = canvas.toDataURL('image/jpeg', 0.7)
          setData(prev => ({ ...prev, photos: [...prev.photos, resized].slice(0, 5) }))
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removePhoto(index: number) {
    setData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }))
  }

  function SectionHeader({ title, section }: { title: string; section: keyof typeof openSections }) {
    return (
      <button
        type="button"
        onClick={() => toggle(section)}
        className="w-full flex items-center justify-between py-3 font-bold text-sm"
      >
        {title}
        {openSections[section] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    )
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onCancel} className="flex items-center gap-1 text-sm text-text-secondary">
          <ArrowLeft size={16} /> 돌아가기
        </button>
        <button
          onClick={() => onSave(data)}
          className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Save size={14} /> {isEdit ? '수정' : '저장'}
        </button>
      </div>

      <div className="space-y-1">
        {/* 기본 정보 */}
        <div className="card px-4">
          <SectionHeader title="기본 정보" section="basic" />
          {openSections.basic && (
            <div className="pb-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-text-secondary">매물명/별칭</label>
                  <input type="text" value={data.basic.name} onChange={e => updateBasic('name', e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" placeholder="예: 감일 A단지" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary">유형</label>
                  <select value={data.basic.propertyType || '아파트'} onChange={e => updateBasic('propertyType', e.target.value as PropertyType)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-white">
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-secondary">주소</label>
                <input type="text" value={data.basic.address} onChange={e => updateBasic('address', e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" placeholder="예: 경기도 하남시 감일동" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary">매매가 (만원)</label>
                  <input type="number" inputMode="numeric" value={data.basic.price || ''} onChange={e => updateBasic('price', Number(e.target.value))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary">관리비 (만원/월)</label>
                  <input type="number" inputMode="numeric" value={data.basic.maintenanceFee || ''} onChange={e => updateBasic('maintenanceFee', Number(e.target.value))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary">전용면적 (m²)</label>
                  <input type="number" inputMode="decimal" value={data.basic.sizeM2 || ''} onChange={e => updateBasic('sizeM2', Number(e.target.value))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary">평수</label>
                  <input type="number" inputMode="decimal" value={data.basic.pyeong || ''} onChange={e => updateBasic('pyeong', Number(e.target.value))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-text-secondary">층</label>
                  <input type="number" inputMode="numeric" value={data.basic.floor || ''} onChange={e => updateBasic('floor', Number(e.target.value))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary">총 층수</label>
                  <input type="number" inputMode="numeric" value={data.basic.totalFloors || ''} onChange={e => updateBasic('totalFloors', Number(e.target.value))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary">방향</label>
                  <select value={data.basic.direction} onChange={e => updateBasic('direction', e.target.value as Direction)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-white">
                    {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-text-secondary">준공연도</label>
                  <input type="number" inputMode="numeric" value={data.basic.buildYear || ''} onChange={e => updateBasic('buildYear', Number(e.target.value))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary">방</label>
                  <input type="number" inputMode="numeric" value={data.basic.rooms || ''} onChange={e => updateBasic('rooms', Number(e.target.value))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary">화장실</label>
                  <input type="number" inputMode="numeric" value={data.basic.bathrooms || ''} onChange={e => updateBasic('bathrooms', Number(e.target.value))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 생활환경 */}
        <div className="card px-4">
          <SectionHeader title="생활환경" section="living" />
          {openSections.living && (
            <div className="pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary">가까운 역</label>
                  <input type="text" value={data.living.stationName} onChange={e => updateLiving('stationName', e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" placeholder="예: 감일역" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary">도보 (분)</label>
                  <input type="number" inputMode="numeric" value={data.living.stationMinutes ?? ''} onChange={e => updateLiving('stationMinutes', e.target.value ? Number(e.target.value) : null)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
              </div>
              <div className="space-y-3">
                <RatingRow label="편의시설" value={data.living.convenience} onChange={v => updateLiving('convenience', v)} />
                <RatingRow label="학군" value={data.living.school} onChange={v => updateLiving('school', v)} />
                <RatingRow label="소음 (높을수록 시끄러움)" value={data.living.noise} onChange={v => updateLiving('noise', v)} invert />
                <RatingRow label="주차" value={data.living.parking} onChange={v => updateLiving('parking', v)} />
                <RatingRow label="채광" value={data.living.sunlight} onChange={v => updateLiving('sunlight', v)} />
                <RatingRow label="조망" value={data.living.view} onChange={v => updateLiving('view', v)} />
              </div>
            </div>
          )}
        </div>

        {/* 출퇴근/교통 */}
        <div className="card px-4">
          <SectionHeader title="출퇴근/교통" section="commute" />
          {openSections.commute && (
            <div className="pb-4 space-y-4">
              {(data.commutes ?? []).map((c, i) => (
                <div key={i} className="space-y-2 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <input type="text" value={c.destination} placeholder="목적지"
                      onChange={e => {
                        const commutes = [...(data.commutes ?? [])]
                        commutes[i] = { ...commutes[i], destination: e.target.value }
                        setData(prev => ({ ...prev, commutes }))
                      }}
                      className="font-medium text-sm border-none p-0 bg-transparent w-40" />
                    <button type="button"
                      onClick={() => setData(prev => ({ ...prev, commutes: (prev.commutes ?? []).filter((_, j) => j !== i) }))}
                      className="text-text-secondary hover:text-danger">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-text-secondary">소요시간</label>
                      <input type="text" value={c.duration} placeholder="예: 45분"
                        onChange={e => {
                          const commutes = [...(data.commutes ?? [])]
                          commutes[i] = { ...commutes[i], duration: e.target.value }
                          setData(prev => ({ ...prev, commutes }))
                        }}
                        className="w-full border border-border rounded px-2 py-1.5 text-xs mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-secondary">거리</label>
                      <input type="text" value={c.distance} placeholder="예: 23km"
                        onChange={e => {
                          const commutes = [...(data.commutes ?? [])]
                          commutes[i] = { ...commutes[i], distance: e.target.value }
                          setData(prev => ({ ...prev, commutes }))
                        }}
                        className="w-full border border-border rounded px-2 py-1.5 text-xs mt-0.5" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary">경로</label>
                    <input type="text" value={c.route} placeholder="예: 8호선 → 2호선 환승 → 강남역"
                      onChange={e => {
                        const commutes = [...(data.commutes ?? [])]
                        commutes[i] = { ...commutes[i], route: e.target.value }
                        setData(prev => ({ ...prev, commutes }))
                      }}
                      className="w-full border border-border rounded px-2 py-1.5 text-xs mt-0.5" />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-text-secondary">환승</label>
                    <input type="number" inputMode="numeric" value={c.transfers || ''} placeholder="0"
                      onChange={e => {
                        const commutes = [...(data.commutes ?? [])]
                        commutes[i] = { ...commutes[i], transfers: Number(e.target.value) }
                        setData(prev => ({ ...prev, commutes }))
                      }}
                      className="w-full border border-border rounded px-2 py-1.5 text-xs mt-0.5" />
                  </div>
                </div>
              ))}
              <button type="button"
                onClick={() => setData(prev => ({
                  ...prev,
                  commutes: [...(prev.commutes ?? []), { destination: '', duration: '', route: '', transfers: 0, distance: '' }]
                }))}
                className="flex items-center gap-1 text-xs text-primary">
                <Plus size={14} /> 목적지 추가
              </button>
            </div>
          )}
        </div>

        {/* 투자 관점 */}
        <div className="card px-4">
          <SectionHeader title="투자 관점" section="invest" />
          {openSections.invest && (
            <div className="pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary">전세가 (만원)</label>
                  <input type="number" inputMode="numeric" value={data.investment.jeonsePrice ?? ''} onChange={e => updateInvest('jeonsePrice', e.target.value ? Number(e.target.value) : null)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary">전세가율</label>
                  <div className="border border-border rounded-lg px-3 py-2 text-sm mt-1 bg-bg text-text-secondary">
                    {data.investment.jeonseRate ? `${data.investment.jeonseRate}%` : '-'}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-text-secondary">시세 변동 메모</label>
                <input type="text" value={data.investment.priceChange} onChange={e => updateInvest('priceChange', e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" placeholder="예: 최근 1년간 5% 상승" />
              </div>
              <div>
                <label className="text-xs text-text-secondary">개발 호재</label>
                <input type="text" value={data.investment.development} onChange={e => updateInvest('development', e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" placeholder="예: GTX-D 노선 확정" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={data.investment.gapInvestPossible} onChange={e => updateInvest('gapInvestPossible', e.target.checked)}
                  className="accent-primary" />
                <span className="text-sm">갭투자 가능</span>
              </label>
            </div>
          )}
        </div>

        {/* 임장 체크 */}
        <div className="card px-4">
          <SectionHeader title="🏠 임장 체크" section="fieldCheck" />
          {openSections.fieldCheck && (
            <div className="pb-4 space-y-3">
              <p className="text-xs text-text-secondary">현장에서 직접 확인한 항목만 체크하세요</p>
              <RatingRow label="수리 상태 (도배/장판/샷시)" value={data.fieldCheck?.condition ?? 3}
                onChange={v => setData(prev => ({ ...prev, fieldCheck: { ...prev.fieldCheck ?? DEFAULT_FIELD_CHECK, condition: v } }))} />
              <RatingRow label="누수/곰팡이/결로" value={data.fieldCheck?.waterLeak ?? 3}
                onChange={v => setData(prev => ({ ...prev, fieldCheck: { ...prev.fieldCheck ?? DEFAULT_FIELD_CHECK, waterLeak: v } }))} />
              <RatingRow label="방음/층간소음" value={data.fieldCheck?.soundproof ?? 3}
                onChange={v => setData(prev => ({ ...prev, fieldCheck: { ...prev.fieldCheck ?? DEFAULT_FIELD_CHECK, soundproof: v } }))} />
              <RatingRow label="수압" value={data.fieldCheck?.waterPressure ?? 3}
                onChange={v => setData(prev => ({ ...prev, fieldCheck: { ...prev.fieldCheck ?? DEFAULT_FIELD_CHECK, waterPressure: v } }))} />
              <RatingRow label="냄새 (하수구/화장실)" value={data.fieldCheck?.smell ?? 3}
                onChange={v => setData(prev => ({ ...prev, fieldCheck: { ...prev.fieldCheck ?? DEFAULT_FIELD_CHECK, smell: v } }))} />
              <RatingRow label="엘리베이터" value={data.fieldCheck?.elevator ?? 3}
                onChange={v => setData(prev => ({ ...prev, fieldCheck: { ...prev.fieldCheck ?? DEFAULT_FIELD_CHECK, elevator: v } }))} />
              <RatingRow label="주변환경 (혐오시설 없음)" value={data.fieldCheck?.surroundings ?? 3}
                onChange={v => setData(prev => ({ ...prev, fieldCheck: { ...prev.fieldCheck ?? DEFAULT_FIELD_CHECK, surroundings: v } }))} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={data.fieldCheck?.balconyExpanded ?? false}
                  onChange={e => setData(prev => ({ ...prev, fieldCheck: { ...prev.fieldCheck ?? DEFAULT_FIELD_CHECK, balconyExpanded: e.target.checked } }))}
                  className="accent-primary" />
                <span className="text-sm">베란다 확장됨</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={data.fieldCheck?.visitedNight ?? false}
                  onChange={e => setData(prev => ({ ...prev, fieldCheck: { ...prev.fieldCheck ?? DEFAULT_FIELD_CHECK, visitedNight: e.target.checked } }))}
                  className="accent-primary" />
                <span className="text-sm">야간 방문 완료</span>
              </label>
              <div>
                <label className="text-xs text-text-secondary">현장 메모</label>
                <textarea value={data.fieldCheck?.fieldMemo ?? ''} placeholder="현장 느낌, 특이사항, 중개사 말씀 등"
                  onChange={e => setData(prev => ({ ...prev, fieldCheck: { ...prev.fieldCheck ?? DEFAULT_FIELD_CHECK, fieldMemo: e.target.value } }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 h-20 resize-none" />
              </div>
            </div>
          )}
        </div>

        {/* 사진/메모 */}
        <div className="card px-4">
          <SectionHeader title="사진/메모" section="record" />
          {openSections.record && (
            <div className="pb-4 space-y-3">
              {/* 사진 */}
              <div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {data.photos.map((photo, i) => (
                    <div key={i} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(i)}
                        className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {data.photos.length < 5 && (
                    <label className="w-20 h-20 shrink-0 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer">
                      <Camera size={20} className="text-text-secondary" />
                      <span className="text-[10px] text-text-secondary mt-1">{data.photos.length}/5</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* 중개사 정보 */}
              <div>
                <label className="text-xs text-text-secondary mb-1 block">중개사 정보</label>
                <div className="space-y-2">
                  <input type="text" value={data.agent?.name ?? ''} placeholder="중개사명 (예: 구리행복공인중개사)"
                    onChange={e => setData(prev => ({ ...prev, agent: { name: e.target.value, phone: prev.agent?.phone ?? '', memo: prev.agent?.memo ?? '' } }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                  <input type="tel" value={data.agent?.phone ?? ''} placeholder="전화번호 (예: 031-123-4567)"
                    onChange={e => setData(prev => ({ ...prev, agent: { name: prev.agent?.name ?? '', phone: e.target.value, memo: prev.agent?.memo ?? '' } }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                  <input type="text" value={data.agent?.memo ?? ''} placeholder="담당자, 참고사항"
                    onChange={e => setData(prev => ({ ...prev, agent: { name: prev.agent?.name ?? '', phone: prev.agent?.phone ?? '', memo: e.target.value } }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              {/* 링크 */}
              <div>
                <label className="text-xs text-text-secondary mb-1 block">관련 링크</label>
                {data.links.map((link, i) => (
                  <div key={i} className="flex gap-2 items-center mb-2">
                    <input type="text" value={link.label} placeholder="이름"
                      onChange={e => {
                        const links = [...data.links]
                        links[i] = { ...links[i], label: e.target.value }
                        setData(prev => ({ ...prev, links }))
                      }}
                      className="w-20 border border-border rounded-lg px-2 py-1.5 text-xs" />
                    <input type="url" value={link.url} placeholder="https://..."
                      onChange={e => {
                        const links = [...data.links]
                        links[i] = { ...links[i], url: e.target.value }
                        setData(prev => ({ ...prev, links }))
                      }}
                      className="flex-1 border border-border rounded-lg px-2 py-1.5 text-xs" />
                    <button type="button" onClick={() => setData(prev => ({ ...prev, links: prev.links.filter((_, j) => j !== i) }))}
                      className="text-text-secondary hover:text-danger shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button"
                  onClick={() => setData(prev => ({ ...prev, links: [...prev.links, { label: '네이버 부동산', url: '' }] }))}
                  className="flex items-center gap-1 text-xs text-primary">
                  <Plus size={14} /> 링크 추가
                </button>
              </div>

              {/* 방문일 */}
              <div>
                <label className="text-xs text-text-secondary">방문일</label>
                <input type="date" value={data.visitDate} onChange={e => setData(prev => ({ ...prev, visitDate: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>

              {/* 메모 */}
              <div>
                <label className="text-xs text-text-secondary">메모</label>
                <textarea value={data.memo} onChange={e => setData(prev => ({ ...prev, memo: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 h-24 resize-none"
                  placeholder="전반적인 느낌, 특이사항 등" />
              </div>

              {/* 별점 */}
              <div>
                <label className="text-xs text-text-secondary block mb-1">전체 평점</label>
                <StarRating value={data.rating} onChange={v => setData(prev => ({ ...prev, rating: v }))} size={28} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
