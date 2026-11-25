#!/usr/bin/env node
/** Starts a dev server and a private CDP browser for contact-sheet QA. */
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';
import { startQaServer } from './qaServer.mjs';

const args = process.argv.slice(2);
const readOption = (name, fallback) => {
  const index = args.findIndex((arg) => arg === name);
  if (index >= 0) return args[index + 1] ?? fallback;
  return args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1) ?? fallback;
};
const explicitBaseUrl = args.some((arg) => arg === '--base-url' || arg.startsWith('--base-url='));
const explicitCdp = args.some((arg) => arg === '--cdp' || arg.startsWith('--cdp='));
const requestedUrl = readOption(
  '--base-url',
  process.env.QA_CAPTURE_URL ?? 'http://127.0.0.1:3004'
).replace(/\/+$/, '');
const requestedCdp = readOption('--cdp', process.env.QA_CAPTURE_CDP);
const port = Number(process.env.QA_CAPTURE_PORT ?? new URL(requestedUrl).port ?? 3004);
let server = { url: requestedUrl, stop: async () => {} };
let browser;

try {
  if (!explicitBaseUrl && !process.env.QA_CAPTURE_URL) {
    server = await startQaServer({ mode: 'dev', port, path: '/contact-sheet.html' });
  }
  if (!explicitCdp && !process.env.QA_CAPTURE_CDP) {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  }
  const endpoint = browser ? new URL(browser.wsEndpoint()) : null;
  const cdpUrl =
    requestedCdp ??
    (endpoint
      ? `${endpoint.protocol === 'wss:' ? 'https:' : 'http:'}//${endpoint.host}`
      : undefined);
  const captureArgs = args.filter((arg, index) => {
    if (arg === '--base-url' || arg === '--cdp') return false;
    if (index > 0 && (args[index - 1] === '--base-url' || args[index - 1] === '--cdp'))
      return false;
    return !arg.startsWith('--base-url=') && !arg.startsWith('--cdp=');
  });
  const child = spawn(
    process.execPath,
    [
      'scripts/capture-contact-sheets.mjs',
      ...captureArgs,
      '--base-url',
      explicitBaseUrl || process.env.QA_CAPTURE_URL ? requestedUrl : server.url,
      ...(cdpUrl ? ['--cdp', cdpUrl] : []),
    ],
    { stdio: 'inherit' }
  );
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (exitCode, signal) => {
      if (signal) reject(new Error(`Contact-sheet capture ended by ${signal}`));
      else resolve(exitCode ?? 1);
    });
  });
  if (code !== 0) process.exitCode = code;
} catch (error) {
  console.error(
    `QA capture setup failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
} finally {
  await browser?.close();
  await server.stop();
}
