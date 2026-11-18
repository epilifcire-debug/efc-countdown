import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button, Input } from '@/components/ui'
import { GoldBackdrop } from '@/components/Backdrop'

type Mode = 'login' | 'signup' | 'forgot'

function translate(msg: string) {
  if (/invalid login/i.test(msg)) return 'E-mail ou senha incorretos.'
  if (/already registered|already been registered/i.test(msg)) return 'Este e-mail já tem cadastro. Faça login.'
  if (/email not confirmed/i.test(msg)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.'
  if (/password should be at least/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (/rate limit/i.test(msg)) return 'Muitas tentativas. Aguarde alguns minutos.'
  return msg
}

export default function AuthPage() {
  const [params] = useSearchParams()
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const loc = useLocation() as { state?: { from?: string } }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Informe um e-mail válido.'
    if (mode !== 'forgot' && password.length < 6) e.password = 'Mínimo de 6 caracteres.'
    if (mode === 'signup') {
      if (name.trim().length < 2) e.name = 'Informe seu nome completo.'
      if (confirm !== password) e.confirm = 'As senhas não conferem.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        nav(loc.state?.from || '/dashboard', { replace: true })
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/dashboard` },
        })
        if (error) throw error
        if (data.session) nav('/dashboard', { replace: true })
        else { toast.success('Conta criada! Confirme pelo link enviado ao seu e-mail.'); setMode('login') }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/redefinir-senha` })
        if (error) throw error
        toast.success('Se o e-mail estiver cadastrado, você receberá o link de redefinição.')
        setMode('login')
      }
    } catch (e) {
      toast.error(translate((e as Error).message))
    } finally {
      setLoading(false)
    }
  }

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } })
    if (error) toast.error(translate(error.message))
  }

  const titles = { login: ['Bem-vindo!', 'Faça login para continuar'], signup: ['Criar conta', 'Preencha seus dados abaixo'], forgot: ['Recuperar senha', 'Enviaremos um link para o seu e-mail'] }[mode]

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <GoldBackdrop fadeTop={0.82} />
      <div className="w-full max-w-sm animate-fade-in">
        <Link to="/" className="mx-auto block w-44" aria-label="Início"><img src={`${import.meta.env.BASE_URL}logo-efc.webp`} style={{ mixBlendMode: 'lighten' }} alt="EFC Tecnologia" width={176} className="w-44" /></Link>
        <p className="mt-1 text-center text-xs font-semibold tracking-[0.3em] text-muted">COUNTDOWN</p>
        <div className="card-gold mt-6 p-6">
          <h1 className="text-center font-display text-xl font-bold">{titles[0]}</h1>
          <p className="mt-1 text-center text-sm text-muted">{titles[1]}</p>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {mode === 'signup' && <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" error={errors.name} />}
            <Input label="E-mail" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" error={errors.email} />
            {mode !== 'forgot' && (
              <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} error={errors.password} />
            )}
            {mode === 'signup' && <Input label="Confirmar senha" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" error={errors.confirm} />}
            {mode === 'login' && (
              <button type="button" onClick={() => setMode('forgot')} className="text-sm text-gold hover:text-gold-light">Esqueceu sua senha?</button>
            )}
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}
            </Button>
          </form>
          {mode !== 'forgot' && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-white/10" />ou<span className="h-px flex-1 bg-white/10" /></div>
              <Button className="w-full" onClick={google} type="button">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z"/></svg>
                Entrar com Google
              </Button>
            </>
          )}
          <p className="mt-6 text-center text-sm text-muted">
            {mode === 'login' ? (
              <>Não tem uma conta? <button onClick={() => setMode('signup')} className="font-medium text-gold hover:text-gold-light">Cadastre-se</button></>
            ) : (
              <>Já tem uma conta? <button onClick={() => setMode('login')} className="font-medium text-gold hover:text-gold-light">Entrar</button></>
            )}
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-muted">by: efcsys</p>
      </div>
    </div>
  )
}
