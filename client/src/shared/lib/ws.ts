type MessageHandler = (data: Record<string, unknown>) => void

const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000, 30000]
const MAX_ATTEMPTS = 6

export class WebSocketManager {
  private url: string
  private socket: WebSocket | null = null
  private handlers = new Map<string, Set<MessageHandler>>()
  private attempt = 0
  private stopped = false
  private retryTimer: ReturnType<typeof setTimeout> | null = null

  constructor(url: string) {
    this.url = url
  }

  connect() {
    if (this.stopped) return
    this.socket = new WebSocket(this.url)

    this.socket.onopen = () => {
      this.attempt = 0
    }

    this.socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as Record<string, unknown>
        const type = msg.type as string | undefined
        if (!type) return
        const handlers = this.handlers.get(type)
        handlers?.forEach((fn) => fn(msg))
      } catch {
        // ignore malformed frames
      }
    }

    this.socket.onclose = (event) => {
      if (this.stopped) return
      // 4001 = auth failure — don't retry
      if (event.code === 4001 || event.code === 4003) return
      this.scheduleReconnect()
    }

    this.socket.onerror = () => {
      this.socket?.close()
    }
  }

  private scheduleReconnect() {
    if (this.attempt >= MAX_ATTEMPTS) return
    const delay = BACKOFF_MS[Math.min(this.attempt, BACKOFF_MS.length - 1)]
    this.attempt++
    this.retryTimer = setTimeout(() => this.connect(), delay)
  }

  subscribe(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(handler)
    return () => this.handlers.get(type)?.delete(handler)
  }

  disconnect() {
    this.stopped = true
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.socket?.close()
    this.socket = null
    this.handlers.clear()
  }
}
