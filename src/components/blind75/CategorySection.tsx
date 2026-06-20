'use client'
import React from 'react'
import ProblemRow from './ProblemRow'

type Props = {
  title: string
  problems: any[]
}

export default function CategorySection({ title, problems }: Props) {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="divide-y">
        {problems.map(p => (
          <ProblemRow key={p.slug} problem={p} />
        ))}
      </div>
    </section>
  )
}
