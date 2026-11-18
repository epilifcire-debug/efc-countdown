import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="font-mono text-5xl font-bold text-gold">404</p>
        <p className="mt-2 text-muted">Página não encontrada.</p>
        <Link to="/" className="mt-6 inline-block"><Button variant="primary">Voltar ao início</Button></Link>
      </div>
    </div>
  )
}
