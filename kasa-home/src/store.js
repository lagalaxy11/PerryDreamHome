import { useSyncExternalStore } from 'react';
import { DEVICES, OUTDOOR_F, TEMP_MAX, TEMP_MIN, defaultState } from './devices';
import * as bridge from './bridge';

// Device state lives here. Every device works out of the box as a simulated
// device (persisted in localStorage). Linking a device to a Kasa plug, switch
// or bulb through the bridge makes its power (and brightness, for dimmers)
// real: commands go to the device and the bridge's state wins on every poll.

const STORAGE_KEY = 'kasa-home-v1';
const POLL_MS = 2000;
const OFFLINE_RETRY_MS = 10000;
const SIM_TICK_MS = 3000;

const DEVICE_BY_ID = Object.fromEntries(DEVICES.map((d) => [d.id, d]));

function loadLocal() {
  let saved = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed && typeof parsed === 'object') saved = parsed;
  } catch {
    // No storage or bad data: start from defaults.
  }
  return Object.fromEntries(DEVICES.map((d) => {
    const s = saved[d.id];
    return [d.id, { ...defaultState(d), ...(s && typeof s === 'object' ? s : {}) }];
  }));
}

function saveLocal(devices) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
  } catch {
    // Ignore: state still works for this session.
  }
}

let state = {
  devices: loadLocal(),
  view: { name: 'home' }, // 'home' | { name: 'ac', id } | 'link'
  bridge: {
    status: 'checking', // 'checking' | 'online' | 'offline' | 'unauthorized'
    error: null,
    devices: [], // Kasa devices reported by the bridge
    mapping: {}, // appDeviceId -> kasaDeviceId
  },
  toast: null,
};

const listeners = new Set();
let started = false;
// Devices with a command in flight; polls don't overwrite them meanwhile.
const pending = new Map();

function set(updater) {
  state = { ...state, ...updater(state) };
  listeners.forEach((l) => l());
}

function patchDevices(patches, { persist = true } = {}) {
  set((s) => {
    const devices = { ...s.devices };
    for (const [id, patch] of Object.entries(patches)) devices[id] = { ...devices[id], ...patch };
    if (persist) saveLocal(devices);
    return { devices };
  });
}

function patchBridge(patch) {
  set((s) => ({ bridge: { ...s.bridge, ...patch } }));
}

let toastTimer;
function toast(message) {
  clearTimeout(toastTimer);
  set(() => ({ toast: message }));
  toastTimer = setTimeout(() => set(() => ({ toast: null })), 4000);
}

// --- Kasa helpers ---------------------------------------------------------

export function kasaDeviceFor(s, appId) {
  const kasaId = s.bridge.mapping[appId];
  if (!kasaId) return null;
  return s.bridge.devices.find((d) => d.id === kasaId) || { id: kasaId, missing: true };
}

// The parts of an app device's state that come from its Kasa device.
function fromKasa(appId, kasa) {
  const patch = { on: kasa.on };
  if (DEVICE_BY_ID[appId]?.kind === 'light' && kasa.brightness != null) patch.brightness = kasa.brightness;
  return patch;
}

function applyKasaDevices(kasaDevices, mapping) {
  const byId = Object.fromEntries(kasaDevices.map((d) => [d.id, d]));
  const patches = {};
  for (const [appId, kasaId] of Object.entries(mapping)) {
    const kasa = byId[kasaId];
    if (kasa && kasa.online && DEVICE_BY_ID[appId] && !pending.has(appId)) patches[appId] = fromKasa(appId, kasa);
  }
  patchDevices(patches);
}

function handleBridgeError(err) {
  if (err.status === 401) patchBridge({ status: 'unauthorized', error: err.message });
  else patchBridge({ status: 'offline', error: err.message });
}

async function poll() {
  try {
    const { devices } = await bridge.getDevices();
    if (state.bridge.status !== 'online') {
      // (Re)connected: the mapping may have changed from another browser.
      const mapping = await bridge.getMapping();
      patchBridge({ mapping });
    }
    patchBridge({ status: 'online', error: null, devices });
    applyKasaDevices(devices, state.bridge.mapping);
  } catch (err) {
    handleBridgeError(err);
  }
  setTimeout(poll, state.bridge.status === 'online' ? POLL_MS : OFFLINE_RETRY_MS);
}

// --- Simulation -----------------------------------------------------------

// Room temperatures drift toward the setpoint while an AC runs, and back
// toward outdoor temperature when it is off. Real temperatures would need a
// sensor; Kasa plugs only switch power.
function simTick() {
  const patches = {};
  for (const device of DEVICES) {
    if (device.kind !== 'ac') continue;
    const s = state.devices[device.id];
    let goal = OUTDOOR_F;
    let rate = 0.04;
    if (s.on && (s.mode === 'cool' || s.mode === 'dry')) {
      goal = Math.min(s.target, s.current);
      rate = s.eco ? 0.05 : s.fan === 'high' ? 0.15 : 0.1;
    } else if (s.on && s.mode === 'heat') {
      goal = Math.max(s.target, s.current);
      rate = 0.1;
    }
    const next = Math.round((s.current + (goal - s.current) * rate) * 10) / 10;
    if (next !== s.current) patches[device.id] = { current: next };
  }
  patchDevices(patches, { persist: false });
}

function start() {
  if (started) return;
  started = true;
  poll();
  setInterval(simTick, SIM_TICK_MS);
}

function subscribe(listener) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHome() {
  return useSyncExternalStore(subscribe, () => state);
}

// --- Actions --------------------------------------------------------------

export function setDevice(id, patch) {
  const device = DEVICE_BY_ID[id];
  const prev = state.devices[id];
  if (device.kind === 'ac' && patch.target != null) {
    patch = { ...patch, target: Math.min(TEMP_MAX, Math.max(TEMP_MIN, patch.target)) };
  }
  patchDevices({ [id]: patch });

  const kasa = kasaDeviceFor(state, id);
  if (!kasa) return;
  const body = {};
  if ('on' in patch) body.on = patch.on;
  if (device.kind === 'light' && 'brightness' in patch && kasa.brightness != null) body.brightness = patch.brightness;
  if (!Object.keys(body).length) return; // e.g. AC setpoint: app-side only
  const revert = Object.fromEntries(Object.keys(body).map((k) => [k, prev[k]]));

  if (kasa.missing || !kasa.online || state.bridge.status !== 'online') {
    patchDevices({ [id]: revert });
    toast(`${device.name}: Kasa device is offline`);
    return;
  }

  pending.set(id, (pending.get(id) || 0) + 1);
  bridge.setDevice(kasa.id, body)
    .then((updated) => {
      patchBridge({ devices: state.bridge.devices.map((d) => (d.id === updated.id ? updated : d)) });
      if (pending.get(id) === 1) patchDevices({ [id]: fromKasa(id, updated) });
    })
    .catch((err) => {
      patchDevices({ [id]: revert });
      toast(`${device.name}: ${err.message}`);
      if (err.status === 401 || err.status === 0) handleBridgeError(err);
    })
    .finally(() => {
      const n = pending.get(id) - 1;
      if (n) pending.set(id, n);
      else pending.delete(id);
    });
}

export function toggle(id) {
  setDevice(id, { on: !state.devices[id].on });
}

export function setAll(kind, on) {
  for (const device of DEVICES) {
    if (device.kind === kind && state.devices[device.id].on !== on) setDevice(device.id, { on });
  }
}

export function showView(view) {
  set(() => ({ view }));
}

export async function linkDevice(appId, kasaId) {
  const previous = state.bridge.mapping;
  const mapping = { ...previous };
  if (kasaId) mapping[appId] = kasaId;
  else delete mapping[appId];
  patchBridge({ mapping });
  try {
    patchBridge({ mapping: await bridge.putMapping(mapping) });
    applyKasaDevices(state.bridge.devices, state.bridge.mapping);
  } catch (err) {
    patchBridge({ mapping: previous });
    toast(`Couldn't save link: ${err.message}`);
  }
}

export async function scanNetwork() {
  try {
    const { devices } = await bridge.discover();
    patchBridge({ devices, status: 'online', error: null });
    applyKasaDevices(devices, state.bridge.mapping);
    toast(`Found ${devices.length} Kasa device${devices.length === 1 ? '' : 's'}`);
  } catch (err) {
    handleBridgeError(err);
    toast(`Scan failed: ${err.message}`);
  }
}

export async function saveToken(token) {
  bridge.setToken(token.trim());
  patchBridge({ status: 'checking', error: null });
  try {
    const [{ devices }, mapping] = await Promise.all([bridge.getDevices(), bridge.getMapping()]);
    patchBridge({ status: 'online', devices, mapping });
    applyKasaDevices(devices, mapping);
  } catch (err) {
    handleBridgeError(err);
  }
}

// Control a Kasa device that isn't placed in the model (no app device).
export function setKasa(kasaId, body) {
  const before = state.bridge.devices.find((d) => d.id === kasaId);
  if (!before) return;
  const replace = (next) => patchBridge({ devices: state.bridge.devices.map((d) => (d.id === kasaId ? next : d)) });
  replace({ ...before, ...body });
  bridge.setDevice(kasaId, body)
    .then(replace)
    .catch((err) => {
      replace(before);
      toast(`${before.alias}: ${err.message}`);
      if (err.status === 401 || err.status === 0) handleBridgeError(err);
    });
}
