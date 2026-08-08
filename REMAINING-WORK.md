# Remaining work — barcode-client

Written 2026-08-09, after the data-loading and polling fixes landed in
production (`a17d7c2`).

**None of these were reported by the client.** They were found while
investigating the reported problems, which are fixed and verified live.

The server-side items — socket authentication, the chat endpoint, CORS, image
sizes — are in `REMAINING-WORK.md` in **barcode-server**. Item 1 below has to be
done together with the server's item 1.

---

## 1. 🔴 Socket subscriptions assume every event reaches every client

**Paired with barcode-server item 1 — do them together.**

The server currently broadcasts every order event to every connected browser,
which is a privacy leak it needs to stop doing. Once it moves to rooms, these
subscriptions change from "listen to everything and filter locally" to "listen
to what this user is entitled to":

| File | Events subscribed |
|---|---|
| `src/context/OrderContext.jsx` | `order_created`, `order_status_updated`, `pending_count_updated` |
| `src/layouts/RiderLayout.jsx` | `rider_order_assigned`, `order_assigned`, `order_updated`, `order_status_updated` |
| `src/pages/rider/RiderOrders.jsx` | same four |
| `src/pages/admin/AdminOrders.jsx` | `order_created`, `order_updated`, `pending_count_updated`, `rider_updated`, `new_chat_message` |
| `src/pages/admin/AdminRidersFleet.jsx` | `order_updated`, `rider_updated` |

Two things need attention in `src/services/socket.js`:

- The socket connects at **module load**, before login. Once the server
  authenticates the handshake it must reconnect after a login/logout so the
  handshake carries the right token — `socket.auth` is already a callback, but
  nothing calls `socket.disconnect()` / `connect()` on a session change.
- `transports: ["websocket"]` disables the polling fallback. It works today, but
  a proxy that does not upgrade WebSockets would leave the app with no realtime
  and no fallback.

Client code should also stop emitting mutations (`order_status_updated`,
`order_updated`, `rider_order_assigned` in `AdminOrders.jsx` and
`RiderOrders.jsx`). The REST call already triggers the server-side emit; the
client emit is a second, unauthenticated path to the same broadcast.

---

## 2. 🟡 `isAssignedToMe` exists three times with three different rules

| File | Rule |
|---|---|
| `src/layouts/RiderLayout.jsx` | checks `riderId`, `rider._id`, `rider.id`, `rider.name` |
| `src/pages/rider/RiderOrders.jsx` | as above, plus `rider?.id` |
| `src/pages/rider/RiderOverview.jsx` and `RiderSettlement.jsx` | inline: `o.riderId === user.id \|\| o.riderName === user.name` |

Because the weakest version is used by Overview and Settlement, an order
assigned through a populated `rider` sub-document counts in the layout's badge
but not in the rider's own stats — **the badge and the page disagree**.

Extract one implementation (a hook or `utils/rider.js`) and use it everywhere.

---

## 3. 🟡 Chat panel depends on the order list carrying `chatHistory`

`src/pages/rider/RiderOrders.jsx:53` reads `chatOrder?.chatHistory?.length`, but
list endpoints exclude `chatHistory`, so it is always 0 and a just-sent message
disappears on the next poll. Fix alongside the server's new
`GET /api/orders/:id/messages`.

---

## 4. Smaller items

- `src/pages/admin/AdminDishes.jsx` renders one `RiderPhoto`-style document
  fetch per row elsewhere in the admin; `src/pages/admin/AdminRiders.jsx:196`
  fires `getApplicationDocUrl` per application — an N+1 of authenticated
  requests. Fetch on open instead of on render.
- Several files carry unused imports (`oxlint` lists them). Harmless, but they
  make the lint output noisy enough that a real warning could be missed.
- `dist` bundle is ~1.6 MB. Route-level `React.lazy` on the admin and rider
  areas would keep the customer-facing site from paying for the dashboards.
