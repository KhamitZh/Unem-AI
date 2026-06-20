const CACHE_NAME = "unem-ai-v3"
const STATIC_ASSETS = [
  "/",
  "/analytics",
  "/currency",
  "/finances/income",
  "/finances/expenses",
  "/finances/goals",
  "/transactions",
  "/deposits",
  "/inflation",
  "/investment",
  "/retirement",
  "/books",
  "/stocks",
  "/crypto",
  "/tax",
  "/community",
  "/leaderboard",
  "/friends",
  "/achievements",
  "/referral",
  "/ai-invest",
  "/financial-plan",
  "/goal-tracker",
  "/logo.png",
]

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {})
    )
  )
  self.skipWaiting()
})

// Activate — ескі кэшті өшіру
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// Fetch стратегиясы
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  const url = new URL(event.request.url)

  // API сұраныстарын кэштемейміз
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: "Offline" }), {
          headers: { "Content-Type": "application/json" },
        })
      )
    )
    return
  }

  // Статикалық файлдар — cache first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".webp")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return res
        })
      })
    )
    return
  }

  // Беттер — network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return res
      })
      .catch(() => caches.match(event.request))
  )
})

// Push notification
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Unem AI", {
      body: data.body ?? "",
      icon: "/logo.png",
      badge: "/logo.png",
      data: { url: data.url ?? "/" },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  )
})

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      const url = event.notification.data.url
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-finances") {
    event.waitUntil(syncFinances())
  }
})

async function syncFinances() {
  try {
    await fetch("/api/finances")
  } catch (e) {
    console.log("Sync failed:", e)
  }
}
