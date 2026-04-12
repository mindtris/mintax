import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import config from './config';

interface TelemetryData {
  installationId: string;
  version: string;
  nodeVersion: string;
  platform: string;
  appUrl: string;
  timestamp: string;
  isDev: boolean;
}

export class TelemetryService {
  private static ID_FILE = path.join(process.cwd(), 'lib', 'core', 'telemetry', '.cache', '.id');

  /**
   * Generates or retrieves a persistent unique installation ID
   */
  private static getInstallationId(): string {
    try {
      // Migration: Remove old ID file from root if it exists
      const oldRootFile = path.join(process.cwd(), '.mintax_id');
      if (fs.existsSync(oldRootFile)) {
        try { fs.unlinkSync(oldRootFile); } catch (e) {}
      }

      const dir = path.dirname(this.ID_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.ID_FILE)) {
        return fs.readFileSync(this.ID_FILE, 'utf8').trim();
      }
      
      const newId = crypto.randomUUID();
      fs.writeFileSync(this.ID_FILE, newId, 'utf8');
      return newId;
    } catch (error) {
      return 'anonymous-' + crypto.randomBytes(4).toString('hex');
    }
  }

  /**
   * Gathers non-sensitive environment metadata
   */
  private static getPayload(): TelemetryData {
    return {
      installationId: this.getInstallationId(),
      version: config.app.version,
      nodeVersion: process.version,
      platform: `${os.platform()} ${os.release()}`,
      appUrl: config.app.baseURL,
      timestamp: new Date().toISOString(),
      isDev: process.env.NODE_ENV === 'development',
    };
  }

  /**
   * Sends a silent "heartbeat" to the telemetry endpoint if configured
   */
  public static async ping(): Promise<void> {
    // Fallback to mindtris endpoint, but allow private override via .env
    const endpoint = process.env.TELEMETRY_ENDPOINT || 'https://api.mindtris.com/telemetry';
    const isDisabled = process.env.TELEMETRY_DISABLED === 'true';

    if (isDisabled) {
      return;
    }

    try {
      const payload = this.getPayload();
      
      // Fire and forget - we don't await this to avoid blocking startup
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mintax-Telemetry-Client',
        },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Silently ignore network errors to prevent app crashes
      });
    } catch (err) {
      // Catch synchronous errors in payload generation
    }
  }
}
