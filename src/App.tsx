import { useState } from 'react'
import { config } from './lib/config.ts'
import { Layout, type TabId } from './components/Layout.tsx'
import { LoginPage } from './components/LoginPage.tsx'
import { SimulatorPage } from './pages/SimulatorPage.tsx'
import { PropertyListPage } from './pages/PropertyListPage.tsx'
import { PropertyFormPage } from './pages/PropertyFormPage.tsx'
import { PropertyDetailPage } from './pages/PropertyDetailPage.tsx'
import { FieldCheckPage } from './pages/FieldCheckPage.tsx'
import { ComparePage } from './pages/ComparePage.tsx'
import { PolicyPage } from './pages/PolicyPage.tsx'
import { useFinance } from './hooks/useFinance.ts'
import { useProperties } from './hooks/useProperties.ts'
import type { Property, FieldCheck } from './types/property.ts'

type SubView =
  | { type: 'list' }
  | { type: 'form'; editId?: string }
  | { type: 'detail'; id: string }
  | { type: 'fieldCheck'; id: string }

export default function App() {
  const [authed, setAuthed] = useState(() => {
    if (sessionStorage.getItem('house-hunter-authed') === '1') return true
    const saved = localStorage.getItem('house-hunter-saved-pw')
    if (saved === config.password) {
      sessionStorage.setItem('house-hunter-authed', '1')
      return true
    }
    return false
  })
  const [currentTab, setCurrentTab] = useState<TabId>('properties')
  const [subView, setSubView] = useState<SubView>({ type: 'list' })
  const finance = useFinance()
  const props = useProperties()

  const isLoading = finance.loading || props.loading

  function handleTabChange(tab: TabId) {
    setCurrentTab(tab)
    setSubView({ type: 'list' })
  }

  function handleSaveProperty(data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) {
    if (subView.type === 'form' && subView.editId) {
      props.updateProperty(subView.editId, data)
      setSubView({ type: 'detail', id: subView.editId })
    } else {
      const created = props.addProperty(data)
      setSubView({ type: 'detail', id: created.id })
    }
  }

  function handleSaveFieldCheck(id: string, fieldCheck: FieldCheck) {
    props.updateProperty(id, { fieldCheck })
    setSubView({ type: 'list' })
  }

  function renderPropertyTab() {
    if (subView.type === 'form') {
      const editProperty = subView.editId ? props.getProperty(subView.editId) : undefined
      const initial = editProperty
        ? { basic: editProperty.basic, living: editProperty.living, investment: editProperty.investment, commutes: editProperty.commutes ?? [], links: editProperty.links ?? [], fieldCheck: editProperty.fieldCheck ?? null, agent: editProperty.agent ?? null, photos: editProperty.photos, memo: editProperty.memo, moveInDate: editProperty.moveInDate ?? null, rating: editProperty.rating, rank: editProperty.rank ?? null, visitDate: editProperty.visitDate }
        : props.createEmpty()
      return (
        <PropertyFormPage
          initial={initial}
          onSave={handleSaveProperty}
          onCancel={() => setSubView(subView.editId ? { type: 'detail', id: subView.editId } : { type: 'list' })}
          isEdit={!!subView.editId}
        />
      )
    }

    if (subView.type === 'detail') {
      const property = props.getProperty(subView.id)
      if (!property) {
        setSubView({ type: 'list' })
        return null
      }
      return (
        <PropertyDetailPage
          property={property}
          financeConfig={finance.config}
          onBack={() => setSubView({ type: 'list' })}
          onEdit={() => setSubView({ type: 'form', editId: property.id })}
          onDelete={() => { props.deleteProperty(property.id); setSubView({ type: 'list' }) }}
          onRankChange={(rank) => props.updateProperty(property.id, { rank })}
        />
      )
    }

    if (subView.type === 'fieldCheck') {
      const property = props.getProperty(subView.id)
      if (!property) {
        setSubView({ type: 'list' })
        return null
      }
      return (
        <FieldCheckPage
          property={property}
          onSave={handleSaveFieldCheck}
          onBack={() => setSubView({ type: 'list' })}
        />
      )
    }

    return (
      <PropertyListPage
        properties={props.properties}
        onAdd={() => setSubView({ type: 'form' })}
        onSelect={id => setSubView({ type: 'detail', id })}
        onFieldCheck={id => setSubView({ type: 'fieldCheck', id })}
      />
    )
  }

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">데이터 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <Layout currentTab={currentTab} onTabChange={handleTabChange}>
      {currentTab === 'simulator' && <SimulatorPage />}
      {currentTab === 'properties' && renderPropertyTab()}
      {currentTab === 'compare' && <ComparePage properties={props.properties} financeConfig={finance.config} />}
      {currentTab === 'policy' && <PolicyPage />}
    </Layout>
  )
}
