import { Calculator, Home, BarChart3, BookOpen } from 'lucide-react'
import { config } from '../lib/config.ts'

export type TabId = 'simulator' | 'properties' | 'compare' | 'policy'

interface LayoutProps {
  currentTab: TabId
  onTabChange: (tab: TabId) => void
  children: React.ReactNode
}

const TABS: { id: TabId; label: string; icon: typeof Calculator }[] = [
  { id: 'simulator', label: '자금', icon: Calculator },
  { id: 'properties', label: '매물', icon: Home },
  { id: 'compare', label: '비교', icon: BarChart3 },
  { id: 'policy', label: '정책', icon: BookOpen },
]

export function Layout({ currentTab, onTabChange, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-bg pb-20">
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center">
          <span className="text-lg">🏠</span>
          <span className="font-bold text-text ml-2">{config.appName}</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>

      <nav className="fixed bottom-4 left-4 right-4 bg-surface border border-border z-20 rounded-2xl shadow-lg">
        <div className="max-w-lg mx-auto flex">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = currentTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                  active ? 'text-primary' : 'text-text-secondary'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className={`text-[10px] ${active ? 'font-semibold' : ''}`}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
