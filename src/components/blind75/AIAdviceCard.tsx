'use client'
import React, { useState } from 'react'

type Props = { problems: any[] }

export default function AIAdviceCard({ problems }: Props) {
  const [advice, setAdvice] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadAdvice() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/blind75-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problems }),
      })
      const data = await res.json()
      setAdvice(data.advice)
    } catch (e) {
      setAdvice({ summary: 'Failed to fetch advice' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">AI Advice</h3>
        <button onClick={loadAdvice} disabled={loading} className="text-sm text-indigo-600">
          {loading ? 'Thinking...' : 'Get Advice'}
        </button>
      </div>
      {advice ? (
        <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(advice, null, 2)}</pre>
      ) : (
        <div className="text-sm text-gray-500">Get personalized tips and next steps.</div>
      )}
    </div>
  )
}
