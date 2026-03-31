import { useState } from 'react'
import { ArrowLeft, Save, CheckCircle } from 'lucide-react'
import type { Property, FieldCheck } from '../types/property.ts'

const DEFAULT_FIELD_CHECK: FieldCheck = {
  condition: 3, plumbing: 3, waterLeak: 3, waterPressure: 3, smell: 3,
  elevator: 3, soundproof: 3, security: 3, parkingReal: 3, buildingMgmt: 3,
  balconyExpanded: false, visitedNight: false, boilerOld: false, asbestosSuspect: false,
  fieldMemo: '',
}

interface Props {
  property: Property
  onSave: (id: string, fieldCheck: FieldCheck) => void
  onBack: () => void
}

function RatingRow({ label, hint, value, onChange }: {
  label: string; hint?: string; value: number; onChange: (v: number) => void
}) {
  const labels = ['', '심각', '나쁨', '보통', '좋음', '매우좋음']
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">{label}</span>
          {hint && <p className="text-[11px] text-text-secondary mt-0.5">{hint}</p>}
        </div>
        <span className="text-xs text-text-secondary">{labels[value]}</span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 h-10 rounded-lg text-sm font-bold transition-colors ${
              n === value
                ? n <= 2 ? 'bg-danger text-white' : n === 3 ? 'bg-warning text-white' : 'bg-success text-white'
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

export function FieldCheckPage({ property, onSave, onBack }: Props) {
  const [check, setCheck] = useState<FieldCheck>({
    ...DEFAULT_FIELD_CHECK,
    ...property.fieldCheck,
  })

  function update<K extends keyof FieldCheck>(key: K, value: FieldCheck[K]) {
    setCheck(prev => ({ ...prev, [key]: value }))
  }

  const isOld = property.basic.buildYear <= 2000

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-text-secondary">
          <ArrowLeft size={16} /> 목록
        </button>
        <button
          onClick={() => onSave(property.id, check)}
          className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Save size={14} /> 저장
        </button>
      </div>

      {/* 매물 요약 */}
      <div className="bg-primary/5 rounded-xl p-3">
        <p className="font-bold text-sm">{property.basic.name || '이름 없음'}</p>
        <p className="text-xs text-text-secondary mt-0.5">
          {property.basic.address} · {property.basic.buildYear}년 ({new Date().getFullYear() - property.basic.buildYear}년차)
        </p>
      </div>

      {/* 집 안 체크 */}
      <div className="card p-4 space-y-5">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wide">집 안 (리모 비용 직결)</h3>

        <RatingRow
          label="수리 상태"
          hint="도배/장판/샷시 상태"
          value={check.condition}
          onChange={v => update('condition', v)}
        />
        <RatingRow
          label="배관/녹물"
          hint="온수 1분 이상 틀어서 색 확인"
          value={check.plumbing}
          onChange={v => update('plumbing', v)}
        />
        <RatingRow
          label="누수/곰팡이/결로"
          hint="천장·벽 얼룩, 창틀 물기, 장판 밑"
          value={check.waterLeak}
          onChange={v => update('waterLeak', v)}
        />
        <RatingRow
          label="수압/배수"
          hint="주방+화장실 동시에 틀어보기, 배수 속도"
          value={check.waterPressure}
          onChange={v => update('waterPressure', v)}
        />
        <RatingRow
          label="냄새"
          hint="현관 열자마자 첫 냄새 (하수구/담배/곰팡이)"
          value={check.smell}
          onChange={v => update('smell', v)}
        />
      </div>

      {/* 구축 주의사항 */}
      {isOld && (
        <div className="card p-4 space-y-3">
          <h3 className="text-xs font-bold text-danger uppercase tracking-wide">구축 주의 ({property.basic.buildYear}년식)</h3>
          <label className="flex items-center gap-3 p-3 rounded-lg bg-red-50">
            <input type="checkbox" checked={check.boilerOld}
              onChange={e => update('boilerOld', e.target.checked)}
              className="accent-danger w-5 h-5" />
            <div>
              <span className="text-sm font-medium">보일러 노후 (15년+)</span>
              <p className="text-[11px] text-text-secondary">제조년도 스티커 확인. 교체 시 100~150만</p>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg bg-red-50">
            <input type="checkbox" checked={check.asbestosSuspect}
              onChange={e => update('asbestosSuspect', e.target.checked)}
              className="accent-danger w-5 h-5" />
            <div>
              <span className="text-sm font-medium">석면 의심</span>
              <p className="text-[11px] text-text-secondary">천장텍스 푸석한 재질, 바닥타일. 리모 시 철거비 추가</p>
            </div>
          </label>
        </div>
      )}

      {/* 건물/단지 체크 */}
      <div className="card p-4 space-y-5">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wide">건물 / 단지</h3>

        <RatingRow
          label="엘리베이터"
          hint="유무, 대수, 상태"
          value={check.elevator}
          onChange={v => update('elevator', v)}
        />
        <RatingRow
          label="방음/복도소음"
          hint="복도식은 발소리, 계단식은 윗집 소음"
          value={check.soundproof}
          onChange={v => update('soundproof', v)}
        />
        <RatingRow
          label="주차 실제상태"
          hint="낮에도 꽉 차면 심각"
          value={check.parkingReal}
          onChange={v => update('parkingReal', v)}
        />
        <RatingRow
          label="보안"
          hint="CCTV, 경비실, 현관 잠금 (1인 여성 거주)"
          value={check.security}
          onChange={v => update('security', v)}
        />
        <RatingRow
          label="건물 관리상태"
          hint="복도/계단 균열, 페인트, 쓰레기장 청결"
          value={check.buildingMgmt}
          onChange={v => update('buildingMgmt', v)}
        />
      </div>

      {/* 체크박스 */}
      <div className="card p-4 space-y-3">
        <label className="flex items-center gap-3 p-2 rounded-lg bg-bg">
          <input type="checkbox" checked={check.balconyExpanded}
            onChange={e => update('balconyExpanded', e.target.checked)}
            className="accent-primary w-5 h-5" />
          <span className="text-sm font-medium">베란다 확장됨</span>
        </label>
        <label className="flex items-center gap-3 p-2 rounded-lg bg-bg">
          <input type="checkbox" checked={check.visitedNight}
            onChange={e => update('visitedNight', e.target.checked)}
            className="accent-primary w-5 h-5" />
          <span className="text-sm font-medium">야간 방문 완료</span>
        </label>
      </div>

      {/* 현장 메모 */}
      <div className="card p-4">
        <label className="text-sm font-medium block mb-2">현장 메모</label>
        <textarea value={check.fieldMemo}
          placeholder="현장 느낌, 중개사 말씀, 특이사항, 전기 차단기 용량 등"
          onChange={e => update('fieldMemo', e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm h-32 resize-none" />
      </div>

      {/* 저장 버튼 하단 */}
      <button
        onClick={() => onSave(property.id, check)}
        className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
      >
        <CheckCircle size={18} /> 임장 체크 저장
      </button>
    </div>
  )
}
