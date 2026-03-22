import { useMemo } from 'react'
import { useAuth } from '../hooks/useSupabase'
import { useLavori } from '../hooks/useSupabase'
import { DashboardSectionCards } from '@/components/dashboard-section-cards'
import { DashboardAreaChart } from '@/components/dashboard-area-chart'

function parseItDate(s) {
  if (!s || typeof s !== 'string') return null
  const parts = s.split('/')
  if (parts.length !== 3) return null
  const dd = Number(parts[0])
  const mm = Number(parts[1])
  const yyyy = Number(parts[2])
  if (!yyyy || !mm || !dd) return null
  const d = new Date(yyyy, mm - 1, dd)
  return Number.isNaN(d.getTime()) ? null : d
}

const Dashboard = () => {
  const { user } = useAuth()
  const { lavori, loading } = useLavori(user?.id)

  const stats = useMemo(() => {
    const worksData = lavori
    if (!worksData || worksData.length === 0) {
      return {
        totalWorks: 0,
        totalHours: 0,
        totalEarnings: 0,
      }
    }
    return {
      totalWorks: worksData.length,
      totalHours: worksData.reduce((sum, w) => sum + (parseFloat(w.durata) || 0), 0),
      totalEarnings: worksData.reduce((sum, w) => sum + (w.importo || 0), 0),
    }
  }, [lavori])

  const chartDailyData = useMemo(() => {
    const ref = new Date()
    ref.setHours(0, 0, 0, 0)
    const map = new Map()
    for (let i = 89; i >= 0; i--) {
      const d = new Date(ref)
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      map.set(key, { date: key, desktop: 0, mobile: 0 })
    }
    for (const work of lavori || []) {
      const wd = parseItDate(work.data)
      if (!wd) continue
      const key = `${wd.getFullYear()}-${String(wd.getMonth() + 1).padStart(2, '0')}-${String(wd.getDate()).padStart(2, '0')}`
      const row = map.get(key)
      if (row) {
        row.desktop += 1
        row.mobile += parseFloat(work.durata) || 0
      }
    }
    return Array.from(map.values())
  }, [lavori])


  return (
    <div className="flex w-full min-w-0 flex-col gap-8 md:gap-10">
      <DashboardSectionCards
        totalEarnings={stats.totalEarnings}
        totalWorks={stats.totalWorks}
        totalHours={stats.totalHours}
        loading={loading}
      />
      <DashboardAreaChart data={chartDailyData} />
    </div>
  )
}

export default Dashboard
