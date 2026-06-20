'use client'
import React from 'react'

type Props = { problems: any[] }

export default function ShareCard({ problems }: Props) {
  const solved = problems.filter(p => p.solved).length
  const total = problems.length

  function copyShare() {
    const text = `I've solved ${solved}/${total} Blind75 problems!`
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="p-4 border rounded">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">Share Progress</div>
          <div className="font-semibold">{solved}/{total} solved</div>
        </div>
        <button onClick={copyShare} className="text-indigo-600 text-sm">
          Copy
        </button>
      </div>
    </div>
  )
}
