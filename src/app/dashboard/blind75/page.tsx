import Blind75Client from './blind75-client'

export const metadata = {
  title: 'Blind 75',
}

export default function Page() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Blind 75</h1>
      <Blind75Client />
    </main>
  )
}
