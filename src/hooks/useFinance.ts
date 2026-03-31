import { useState, useEffect, useCallback, useRef } from 'react'
import { DEFAULT_FINANCE, type FinanceConfig, type AssetItem } from '../types/finance.ts'
import { loadStore, saveStore } from '../lib/supabase.ts'

const STORE_KEY = 'house-hunter:finance'

export function useFinance() {
  const [config, setConfig] = useState<FinanceConfig>(DEFAULT_FINANCE)
  const [loading, setLoading] = useState(true)
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>()

  const persist = useCallback((data: FinanceConfig) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      saveStore(STORE_KEY, data).catch(console.error)
    }, 500)
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const remote = await loadStore<FinanceConfig>(STORE_KEY)
        if (remote) setConfig(remote)
      } catch (err) {
        console.error('Supabase load failed, using default:', err)
      }
      setLoading(false)
    }
    init()
  }, [])

  function update(fn: (prev: FinanceConfig) => FinanceConfig) {
    setConfig(prev => {
      const next = fn(prev)
      persist(next)
      return next
    })
  }

  function toggleAsset(id: string) {
    update(prev => ({
      ...prev,
      assets: prev.assets.map(a => a.id === id ? { ...a, included: !a.included } : a),
    }))
  }

  function updateAssetAmount(id: string, amount: number) {
    update(prev => ({
      ...prev,
      assets: prev.assets.map(a => a.id === id ? { ...a, amount } : a),
    }))
  }

  function setLTV(rate: 70 | 80) {
    update(prev => ({ ...prev, ltvRate: rate }))
  }

  function updateConfig(patch: Partial<FinanceConfig>) {
    update(prev => ({ ...prev, ...patch }))
  }

  function addAsset(asset: AssetItem) {
    update(prev => ({ ...prev, assets: [...prev.assets, asset] }))
  }

  function removeAsset(id: string) {
    update(prev => ({ ...prev, assets: prev.assets.filter(a => a.id !== id) }))
  }

  const totalEquity = config.assets
    .filter(a => a.included)
    .reduce((sum, a) => sum + a.amount, 0)

  return {
    config, loading, totalEquity,
    toggleAsset, updateAssetAmount, setLTV, updateConfig, addAsset, removeAsset,
  }
}
