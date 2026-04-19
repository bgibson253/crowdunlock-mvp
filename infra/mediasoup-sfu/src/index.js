import express from 'express';
import { WebSocketServer } from 'ws';
import mediasoup from 'mediasoup';

const PORT = Number(process.env.PORT || 8080);
const RTP_MIN_PORT = Number(process.env.RTP_MIN_PORT || 10000);
const RTP_MAX_PORT = Number(process.env.RTP_MAX_PORT || 20000);

const app = express();
app.get('/health', (_req, res) => res.json({ ok: true }));

const server = app.listen(PORT, () => {
  console.log(`SFU listening on :${PORT}`);
});

const wss = new WebSocketServer({ server, path: '/ws' });

// Worker/router for later mediasoup transports (next milestone).
const worker = await mediasoup.createWorker({
  rtcMinPort: RTP_MIN_PORT,
  rtcMaxPort: RTP_MAX_PORT,
});
worker.on('died', () => {
  console.error('mediasoup worker died, exiting');
  process.exit(1);
});
await worker.createRouter({
  mediaCodecs: [
    { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
    { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 },
    { kind: 'video', mimeType: 'video/H264', clockRate: 90000, parameters: { 'packetization-mode': 1, 'profile-level-id': '42e01f', 'level-asymmetry-allowed': 1 } },
  ],
});

// Bootstrapping signaling server (NOT SFU yet):
// This is an MVP WebRTC relay using a single RTCPeerConnection on the server.
// It validates:
// - SFU box reachability
// - TURN plumbing on clients
// - signaling reliability
// Next milestone replaces this with true mediasoup send/recv transports.

let host = null; // { ws, pc }
let pendingOffer = null; // { sdp }

function send(ws, msg) {
  try {
    ws.send(JSON.stringify(msg));
  } catch {
    // ignore
  }
}

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    const msg = JSON.parse(String(data));

    if (msg.t === 'webrtc.offer') {
      // host has created an offer. Store and broadcast to any waiting viewer.
      pendingOffer = { sdp: msg.sdp };
      // echo back so host knows we accepted
      return send(ws, { t: 'webrtc.offer.ok' });
    }

    if (msg.t === 'viewer.ready') {
      if (pendingOffer?.sdp) {
        return send(ws, { t: 'webrtc.offer', sdp: pendingOffer.sdp });
      }
      return send(ws, { t: 'webrtc.offer.missing' });
    }

    if (msg.t === 'webrtc.answer') {
      // forward answer to host if connected
      if (host?.ws) {
        send(host.ws, { t: 'webrtc.answer', sdp: msg.sdp });
      }
      return;
    }

    if (msg.t === 'webrtc.ice') {
      // naive broadcast
      if (host?.ws && host.ws !== ws) send(host.ws, { t: 'webrtc.ice', candidate: msg.candidate });
      // viewers are ephemeral; just send to all others by tracking not implemented
      return;
    }
  });

  ws.on('close', () => {
    if (host?.ws === ws) host = null;
  });

  // First socket can act as host. (Temporary; room/role auth comes next.)
  if (!host) host = { ws };
});
