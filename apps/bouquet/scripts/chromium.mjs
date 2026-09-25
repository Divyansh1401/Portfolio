/**
 * @file Where the browser tests and benches find Chromium. In order:
 * $CHROMIUM_PATH, the cloud container's pre-installed Chromium, then the
 * locally installed Google Chrome (playwright's "chrome" channel). Never
 * `playwright install`.
 */
import { existsSync } from 'node:fs';

const CLOUD_CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/** @returns {{executablePath: string} | {channel: string}} */
export function chromiumTarget() {
  if (process.env.CHROMIUM_PATH) return { executablePath: process.env.CHROMIUM_PATH };
  if (existsSync(CLOUD_CHROMIUM)) return { executablePath: CLOUD_CHROMIUM };
  return { channel: 'chrome' };
}
