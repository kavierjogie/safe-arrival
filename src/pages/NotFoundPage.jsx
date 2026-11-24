import { Link } from 'react-router-dom'
import { MapPinOff } from 'lucide-react'
import { PublicHeader } from '../components/layout/Layouts'
import { Button } from '../components/common/ui'

export default function NotFoundPage() {
  return (
    <div>
      <PublicHeader />
      <main className="grid place-items-center px-4 py-24 text-center">
        <MapPinOff className="size-10 text-muted" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold">This page took a wrong turn</h1>
        <p className="mt-1 text-muted">The page you're looking for doesn't exist.</p>
        <Button as={Link} to="/" className="mt-6">Back to home</Button>
      </main>
    </div>
  )
}
