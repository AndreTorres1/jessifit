import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renderiza os filhos diretamente no <body>, fora de qualquer ancestral com
 * transform/filter/backdrop-blur — que de outra forma quebram os modais
 * `position: fixed` (posicionam-nos relativos ao ancestral, não ao ecrã).
 */
export function Portal({ children }: { children: ReactNode }) {
  const [el] = useState(() => document.createElement('div'))
  useEffect(() => {
    document.body.appendChild(el)
    return () => {
      document.body.removeChild(el)
    }
  }, [el])
  return createPortal(children, el)
}
