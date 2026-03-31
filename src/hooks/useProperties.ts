import { useState, useEffect, useCallback, useRef } from 'react'
import { nanoid } from 'nanoid'
import type { Property } from '../types/property.ts'
import { EMPTY_PROPERTY } from '../types/property.ts'
import { SEED_PROPERTIES } from '../lib/seed.ts'
import { loadStore, saveStore } from '../lib/supabase.ts'

const STORE_KEY = 'house-hunter:properties'
const SEED_VERSION_KEY = 'house-hunter:seed-version'
const CURRENT_SEED_VERSION = '1'

function mergeSeed(existing: Property[]): Property[] {
  const seedMap = new Map(SEED_PROPERTIES.map(s => [s.id, s]))
  const updated = existing.map(p => {
    const seed = seedMap.get(p.id)
    if (!seed) return p
    return {
      ...seed,
      rating: p.rating || seed.rating,
      rank: p.rank ?? seed.rank,
      moveInDate: p.moveInDate ?? seed.moveInDate,
      photos: p.photos.length > 0 ? p.photos : seed.photos,
      fieldCheck: p.fieldCheck ?? seed.fieldCheck,
      updatedAt: new Date().toISOString(),
    }
  })
  const existingIds = new Set(existing.map(p => p.id))
  const newSeeds = SEED_PROPERTIES.filter(s => !existingIds.has(s.id))
  return [...updated, ...newSeeds]
}

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>()

  // Supabase에 debounce 저장
  const persist = useCallback((data: Property[]) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      saveStore(STORE_KEY, data).catch(console.error)
    }, 500)
  }, [])

  // 초기 로드
  useEffect(() => {
    async function init() {
      try {
        const remote = await loadStore<Property[]>(STORE_KEY)
        const seedVersion = await loadStore<string>(SEED_VERSION_KEY)

        if (remote && seedVersion === CURRENT_SEED_VERSION) {
          setProperties(remote)
        } else {
          const base = remote ?? []
          const merged = mergeSeed(base)
          setProperties(merged)
          await saveStore(STORE_KEY, merged)
          await saveStore(SEED_VERSION_KEY, CURRENT_SEED_VERSION)
        }
      } catch (err) {
        console.error('Supabase load failed, falling back to localStorage:', err)
        const local = JSON.parse(localStorage.getItem(STORE_KEY) || '[]')
        setProperties(local.length > 0 ? local : mergeSeed([]))
      }
      setLoading(false)
    }
    init()
  }, [])

  function addProperty(data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Property {
    const now = new Date().toISOString()
    const property: Property = { ...data, id: nanoid(), createdAt: now, updatedAt: now }
    setProperties(prev => {
      const next = [property, ...prev]
      persist(next)
      return next
    })
    return property
  }

  function updateProperty(id: string, data: Partial<Omit<Property, 'id' | 'createdAt'>>) {
    setProperties(prev => {
      const next = prev.map(p =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      )
      persist(next)
      return next
    })
  }

  function deleteProperty(id: string) {
    setProperties(prev => {
      const next = prev.filter(p => p.id !== id)
      persist(next)
      return next
    })
  }

  function getProperty(id: string): Property | undefined {
    return properties.find(p => p.id === id)
  }

  function createEmpty(): Omit<Property, 'id' | 'createdAt' | 'updatedAt'> {
    return structuredClone(EMPTY_PROPERTY)
  }

  return { properties, loading, addProperty, updateProperty, deleteProperty, getProperty, createEmpty }
}
