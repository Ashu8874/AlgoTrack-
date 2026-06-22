'use client'
import React from 'react'
import type { Problem } from '@/lib/blind75Data'

type Props = { problems: Array<Problem & { solved?: boolean }> }

export default function ProgressHeader({ problems }: Props) {
  const total = problems.length
  const solved = problems.filter(p => p.solved).length
  const percent = total ? Math.round((solved / total) * 100) : 0

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">Blind 75 Progress</h2>
        <div className="text-sm text-gray-600">{solved}/{total}</div>
      </div>
      <div className="w-full bg-gray-200 h-3 rounded mt-2">
        <div className="bg-indigo-600 h-3 rounded" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
