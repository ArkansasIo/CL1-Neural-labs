import { BUILD_INFO } from './src/config/buildInfo';
import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const HOST = '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

// Cortical Labs CL1 Constants
const TOTAL_CHANNELS = 64;
const GROUNDED_CHANNELS = [0, 7, 56, 63];
const REFERENCE_CHANNELS = [4];
const FLAG_HAS_SPIKE = 1 << 0;
const FLAG_HAS_STIM = 1 << 1;
const UV_PER_RAW_ADC = 0.195;

// This server is a project simulator. Ground/reference channels and out-of-range
// values are rejected before they can enter the virtual event queue.
const isStimChannel = (channel: unknown): channel is number =>
  typeof channel === 'number' && Number.isInteger(channel) && channel >= 0 && channel < TOTAL_CHANNELS &&
  !GROUNDED_CHANNELS.includes(channel) && !REFERENCE_CHANNELS.includes(channel);

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);

  // WebSocket Server on path /_/ws/overview matching Cortical Labs CL1 protocol
  const wss = new WebSocketServer({ server, path: '/_/ws/overview' });

  // In-memory simulation state
  const channelMeans = new Float32Array(TOTAL_CHANNELS);
  const channelStdDevs = new Float32Array(TOTAL_CHANNELS).fill(8.5);
  let isPaused = false;
  let playbackSpeed = 1.0;
  let frameCounter = 0;

  // Active stimulation queue
  const stimQueue: number[] = [];

  // Broadcast to all WebSocket overview clients
  const broadcastBinaryChunk = () => {
    if (isPaused || wss.clients.size === 0) return;

    frameCounter++;

    // 1 chunk, 64 channels, 3 int16 values per channel = 192 int16s = 384 bytes
    const payload = new Int16Array(TOTAL_CHANNELS * 3);

    for (let ch = 0; ch < TOTAL_CHANNELS; ch++) {
      const isGrounded = GROUNDED_CHANNELS.includes(ch);
      const isRef = REFERENCE_CHANNELS.includes(ch);

      let min = 0;
      let max = 0;
      let flags = 0;

      if (isGrounded) {
        min = Math.round((Math.random() - 0.5) * 4);
        max = Math.round((Math.random() - 0.5) * 4);
      } else if (isRef) {
        min = Math.round((Math.random() - 0.5) * 8);
        max = Math.round((Math.random() - 0.5) * 8);
      } else {
        // Spontaneous spike check (Poisson)
        const hasSpike = Math.random() < 0.05;
        const stimIndex = stimQueue.indexOf(ch);
        const hasStim = stimIndex !== -1;

        if (hasStim) {
          stimQueue.splice(stimIndex, 1);
          flags |= FLAG_HAS_STIM;
          min = Math.round(-600 / UV_PER_RAW_ADC);
          max = Math.round(600 / UV_PER_RAW_ADC);
        } else if (hasSpike) {
          flags |= FLAG_HAS_SPIKE;
          min = Math.round(-80 / UV_PER_RAW_ADC);
          max = Math.round(35 / UV_PER_RAW_ADC);
        } else {
          const noise = (Math.random() - 0.5) * 12;
          min = Math.round((noise - 5) / UV_PER_RAW_ADC);
          max = Math.round((noise + 5) / UV_PER_RAW_ADC);
        }
      }

      payload[ch * 3 + 0] = min;
      payload[ch * 3 + 1] = max;
      payload[ch * 3 + 2] = flags;
    }

    const buffer = Buffer.from(payload.buffer);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(buffer, { binary: true });
      }
    }
  };

  // Run broadcast loop at 50 Hz (20ms interval)
  const broadcastInterval = setInterval(broadcastBinaryChunk, 20);

  wss.on('connection', (ws: WebSocket, req) => {
    // Send reset message with channel means
    const resetMsg = {
      status: 'reset',
      analysisMs: 20,
      playback_speed: playbackSpeed,
      is_paused: isPaused,
      channel_mean: Array.from(channelMeans),
      channel_stddev: Array.from(channelStdDevs),
    };
    ws.send(JSON.stringify(resetMsg));

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.action === 'stimulate' && isStimChannel(data.channel)) {
          stimQueue.push(data.channel);
        } else if (data.action === 'reset') {
          ws.send(JSON.stringify(resetMsg));
        } else if (data.action === 'pause') {
          isPaused = true;
        } else if (data.action === 'resume') {
          isPaused = false;
        }
      } catch (err) {
        // Ignore unparseable message
      }
    });
  });

  // REST API Endpoints

  // Cortical Labs native /_/config endpoint
  app.get('/_/config', (req: Request, res: Response) => {
    const host = req.headers.host || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'wss' : 'ws';
    res.json({
      device_id: 'CL1-SIM-001',
      name: 'Cortical Labs CL1 Bio-Computer Simulator',
      channel_count: 64,
      sampling_frequency: 25000,
      overview_url: `${protocol}://${host}/_/ws/overview`,
      websocket_url: `${protocol}://${host}`,
    });
  });

  // Build identity API
  app.get('/api/build', (req: Request, res: Response) => {
    res.json(BUILD_INFO);
  });

  // API Status
  app.get('/api/status', (req: Request, res: Response) => {
    res.json({
      ...BUILD_INFO,
      status: 'online',
      hardware: 'Cortical Labs CL1 Wetware System',
      channelCount: TOTAL_CHANNELS,
      samplingRateHz: 25000,
      wsClients: wss.clients.size,
      isPaused,
      playbackSpeed,
      frameCounter,
    });
  });

  // API Stimulate
  app.post('/api/stim', (req: Request, res: Response) => {
    const { channels } = req.body;
    if (!Array.isArray(channels)) {
      res.status(400).json({ error: 'channels must be an array of integer channel IDs' });
      return;
    }
    const invalidChannels = channels.filter((ch: unknown) => !isStimChannel(ch));
    if (invalidChannels.length > 0) {
      res.status(400).json({
        error: 'channels contain invalid, grounded, or reference channel IDs',
        invalidChannels,
      });
      return;
    }
    channels.forEach((ch: number) => stimQueue.push(ch));
    res.json({ success: true, stimulatedChannels: channels });
  });

  // Serve static assets from public/
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Vite middleware in dev or static in prod
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, HOST, () => {
    console.log(`[CL1 Server] Running on http://${HOST}:${PORT}`);
    console.log(`[CL1 Server] WebSocket available at ws://${HOST}:${PORT}/_/ws/overview`);
  });
}

startServer().catch((err) => {
  console.error('[CL1 Server] Failed to start:', err);
  process.exit(1);
});
