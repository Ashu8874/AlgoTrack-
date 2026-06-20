'use client'
import React, { useEffect, useState } from 'react'
import ProgressHeader from '../../../components/blind75/ProgressHeader'
import CategorySection from '../../../components/blind75/CategorySection'
import AIAdviceCard from '../../../components/blind75/AIAdviceCard'
import ShareCard from '../../../components/blind75/ShareCard'

export default function Blind75Client() {
  const [problems, setProblems] = useState<any[] | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/blind75/progress')
      .then(r => r.json())
      .then(data => {
        if (!mounted) return
        setProblems(data.problems)
      })
      .catch(() => {
        if (!mounted) return
        setProblems([])
      })
    return () => {
      mounted = false
    }
  }, [])

  if (!problems) return <div>Loading...</div>

  const byCategory: Record<string, any[]> = {}
  problems.forEach(p => {
    const cat = p.category || 'Other'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(p)
  })

  return (
    <div className="space-y-6">
      <ProgressHeader problems={problems} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {Object.keys(byCategory).map(cat => (
            <CategorySection key={cat} title={cat} problems={byCategory[cat]} />
          ))}
        </div>
        <div className="space-y-4">
          <AIAdviceCard problems={problems} />
          <ShareCard problems={problems} />
        </div>
      </div>
    </div>
  )
}
