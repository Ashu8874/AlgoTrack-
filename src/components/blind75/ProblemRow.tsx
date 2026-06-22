'use client'
import React, { useState } from 'react'
import type { Problem } from '@/lib/blind75Data'

type Props = {
  problem: Problem & { solved?: boolean; autoDetected?: boolean }
}

export default function ProblemRow({ problem }: Props) {
  const [solved, setSolved] = useState<boolean>(!!problem.solved)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const newVal = !solved
    setSolved(newVal)
    try {
      await fetch('/api/blind75/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: problem.slug, solved: newVal }),
      })
    } catch {
      setSolved(!newVal)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={solved} onChange={toggle} disabled={loading} />
        <a href={problem.leetcodeUrl} target="_blank" rel="noreferrer" className="underline">
          {problem.title}
        </a>
        {problem.autoDetected ? <span className="text-sm text-gray-500">(auto)</span> : null}
      </div>
      <div className="text-sm text-gray-500">{problem.difficulty}</div>
    </div>
  )
}
