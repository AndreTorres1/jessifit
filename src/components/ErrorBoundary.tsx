import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Apanha erros de renderização para a app não ficar em branco. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Em produção, poderia enviar para um serviço de erros.
    console.error('JessiFit error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl text-2xl"
            style={{ background: 'var(--red-wash)' }}
          >
            😕
          </div>
          <div>
            <h1 className="font-[var(--font-display)] text-xl font-bold">
              Algo correu mal
            </h1>
            <p className="mt-1 text-sm text-muted">
              A app encontrou um erro inesperado. Recarrega para tentar de novo.
            </p>
          </div>
          <button
            onClick={() => location.reload()}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(150deg, var(--accent-bright), var(--accent-deep))',
            }}
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
