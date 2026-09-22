import { savePushSubscription, removePushSubscription } from '@/data/remote'

/** Chave pública VAPID (é pública por design). */
const VAPID_PUBLIC =
  'BBGBXUuJI1iyG5rMOihqWku6RlkgqT9O-2s5L4c1Xn7NCh5eVahAwXomVZFSsjpVTrXZ47MrO7Lxv4bBRazp3ag'

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

/** A app está a correr instalada (adicionada ao ecrã inicial)? */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export type PushState = 'unsupported' | 'need-install' | 'default' | 'granted' | 'denied'

export function pushState(): PushState {
  if (!pushSupported()) return 'unsupported'
  if (isIos() && !isStandalone()) return 'need-install'
  return Notification.permission as PushState
}

function urlB64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export type EnableResult = 'ok' | 'denied' | 'unsupported' | 'need-install' | 'error'

export async function enablePush(userId: string): Promise<EnableResult> {
  if (!pushSupported()) return 'unsupported'
  if (isIos() && !isStandalone()) return 'need-install'
  try {
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return 'denied'
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      })
    }
    await savePushSubscription(userId, sub.toJSON())
    return 'ok'
  } catch {
    return 'error'
  }
}

export async function disablePush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await removePushSubscription(sub.endpoint)
      await sub.unsubscribe()
    }
  } catch {
    /* ignora */
  }
}
