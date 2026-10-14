import React, { useEffect, useRef, useState } from 'react';
import { AC_MODES, DEVICES, FAN_SPEEDS, TEMP_MAX, TEMP_MIN } from './devices';
import {
  kasaDeviceFor, linkDevice, saveToken, scanNetwork, setAll, setDevice, showView, toggle, useHome,
} from './store';
import {
  BackIcon, BulbIcon, ChevronIcon, DropIcon, FanIcon, HomeIcon, LeafIcon, MinusIcon, MoonIcon,
  PlugIcon, PlusIcon, PowerIcon, RadarIcon, SnowIcon, SunIcon, ThermoIcon, WindIcon,
} from './icons';

const MODE_ICONS = { cool: SnowIcon, heat: SunIcon, dry: DropIcon, fan: FanIcon };
const MODE_LABELS = { cool: 'Cooling', heat: 'Heating', dry: 'Drying', fan: 'Fan only' };

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="sh-switch"
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    >
      <span />
    </button>
  );
}

function summary(s) {
  const lights = DEVICES.filter((d) => d.kind === 'light');
  const lit = lights.filter((d) => s.devices[d.id].on).length;
  const acs = DEVICES.filter((d) => d.kind === 'ac' && s.devices[d.id].on);
  const ac = acs.length === 0 ? 'ACs off'
    : acs.length === 1 ? `AC ${s.devices[acs[0].id].target}°`
      : `${acs.length} ACs on`;
  return { text: `${lit} of ${lights.length} lights on · ${ac}`, any: lit > 0 || acs.length > 0 };
}

function BridgeBadge({ bridge }) {
  const linked = Object.keys(bridge.mapping).length;
  const label = {
    checking: 'Connecting…',
    online: `Kasa · ${linked} linked`,
    offline: 'Simulated',
    unauthorized: 'Bridge locked',
  }[bridge.status];
  return (
    <button type="button" className={`sh-badge sh-badge--${bridge.status}`} onClick={() => showView({ name: 'link' })}>
      <i />{label}
    </button>
  );
}

function Header({ s }) {
  const { text, any } = summary(s);
  return (
    <header className="sh-header">
      <div className="sh-header__icon"><HomeIcon /></div>
      <div className="sh-header__text">
        <strong>Perry Dream Home</strong>
        <span><i className={any ? 'is-on' : ''} />{text}</span>
      </div>
      <BridgeBadge bridge={s.bridge} />
    </header>
  );
}

function sourceLabel(s, id) {
  const kasa = kasaDeviceFor(s, id);
  if (!kasa) return { text: 'Simulated', offline: false };
  if (kasa.missing) return { text: 'Kasa · not found', offline: true };
  return { text: `Kasa · ${kasa.alias}`, offline: !kasa.online || s.bridge.status !== 'online' };
}

function LightRow({ s, device }) {
  const state = s.devices[device.id];
  const kasa = kasaDeviceFor(s, device.id);
  const dimmable = kasa ? kasa.brightness != null : false;
  const src = sourceLabel(s, device.id);
  return (
    <div className={`sh-row ${state.on ? 'is-on' : ''}`} onClick={() => toggle(device.id)}>
      <div className="sh-row__icon sh-row__icon--light"><BulbIcon /></div>
      <div className="sh-row__text">
        <span>{device.name}</span>
        <small className={src.offline ? 'is-offline' : ''}>{src.text}{src.offline && ' · offline'}</small>
        {dimmable && state.on && (
          <input
            className="sh-dimmer"
            type="range"
            min="1"
            max="100"
            aria-label={`${device.name} brightness`}
            defaultValue={state.brightness}
            key={state.brightness}
            onClick={(e) => e.stopPropagation()}
            onPointerUp={(e) => setDevice(device.id, { brightness: Number(e.currentTarget.value) })}
            onKeyUp={(e) => setDevice(device.id, { brightness: Number(e.currentTarget.value) })}
          />
        )}
      </div>
      <Switch checked={state.on} label={device.name} onChange={(on) => setDevice(device.id, { on })} />
    </div>
  );
}

function ACRow({ s, device }) {
  const state = s.devices[device.id];
  const ModeIcon = MODE_ICONS[state.mode];
  return (
    <div className={`sh-row ${state.on ? 'is-on is-cool' : ''}`} onClick={() => showView({ name: 'ac', id: device.id })}>
      <div className="sh-row__icon sh-row__icon--ac"><ModeIcon /></div>
      <div className="sh-row__text">
        <span>{device.name}</span>
        <small>{state.on ? `${MODE_LABELS[state.mode]} to ${state.target}°F` : 'Off'} · room {state.current.toFixed(1)}°F</small>
      </div>
      <Switch checked={state.on} label={device.name} onChange={(on) => setDevice(device.id, { on })} />
      <ChevronIcon className="sh-row__chevron" />
    </div>
  );
}

function HomeView({ s, rooms }) {
  return (
    <div className="sh-body">
      <div className="sh-quick">
        <button type="button" onClick={() => setAll('light', false)}>All lights off</button>
        <button type="button" onClick={() => setAll('light', true)}>All lights on</button>
        <button type="button" onClick={() => setAll('ac', false)}>All ACs off</button>
      </div>
      {rooms.map((room) => {
        const devices = DEVICES.filter((d) => d.room === room.id);
        if (!devices.length) return null;
        return (
          <section key={room.id} className="sh-room">
            <h3>{room.name}</h3>
            {devices.map((d) => (d.kind === 'light'
              ? <LightRow key={d.id} s={s} device={d} />
              : <ACRow key={d.id} s={s} device={d} />))}
          </section>
        );
      })}
    </div>
  );
}

function ACView({ s, id }) {
  const device = DEVICES.find((d) => d.id === id);
  const state = s.devices[id];
  const kasa = kasaDeviceFor(s, id);
  // Local draft so dragging the slider doesn't send a command per pixel.
  const [draft, setDraft] = useState(state.target);
  const timer = useRef();
  useEffect(() => setDraft(state.target), [state.target]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const commitTarget = (value) => {
    setDraft(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDevice(id, { target: value }), 250);
  };
  const cycle = (list, value) => list[(list.indexOf(value) + 1) % list.length];
  const pct = ((draft - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 100;
  const ModeIcon = MODE_ICONS[state.mode];

  return (
    <div className={`sh-body sh-ac ${state.on ? '' : 'is-off'}`}>
      <div className="sh-ac__top">
        <button type="button" className="sh-round" aria-label="Back" onClick={() => showView({ name: 'home' })}><BackIcon /></button>
        <div className="sh-ac__title">
          <strong>{device.name}</strong>
          <span><ThermoIcon size={13} /> Room {state.current.toFixed(1)}°F <i className={state.on ? 'is-on' : ''} /></span>
        </div>
        <button
          type="button"
          className={`sh-power ${state.on ? 'is-on' : ''}`}
          aria-label={state.on ? 'Turn off' : 'Turn on'}
          aria-pressed={state.on}
          onClick={() => setDevice(id, { on: !state.on })}
        >
          <PowerIcon size={22} />
        </button>
      </div>

      <div className="sh-ac__temp">
        <div className="sh-ac__value">{draft}<sup>°F</sup></div>
        <label className="sh-pill">
          <LeafIcon size={16} />
          Eco Mode
          <Switch checked={state.eco} label="Eco mode" onChange={(eco) => setDevice(id, { eco, sleep: eco ? false : state.sleep })} />
        </label>
      </div>

      <div className="sh-ac__slider">
        <button type="button" className="sh-round" aria-label="Cooler" onClick={() => commitTarget(Math.max(TEMP_MIN, draft - 1))}><MinusIcon /></button>
        <input
          type="range"
          min={TEMP_MIN}
          max={TEMP_MAX}
          value={draft}
          aria-label="Target temperature"
          style={{ '--pct': `${pct}%` }}
          onChange={(e) => commitTarget(Number(e.target.value))}
        />
        <button type="button" className="sh-round" aria-label="Warmer" onClick={() => commitTarget(Math.min(TEMP_MAX, draft + 1))}><PlusIcon /></button>
      </div>
      <div className="sh-ac__range"><span>{TEMP_MIN}°</span><span>{TEMP_MAX}°</span></div>

      <div className="sh-ac__modes">
        <button type="button" onClick={() => setDevice(id, { mode: cycle(AC_MODES, state.mode) })}>
          <ModeIcon /><span>{MODE_LABELS[state.mode]}</span>
        </button>
        <button type="button" onClick={() => setDevice(id, { fan: cycle(FAN_SPEEDS, state.fan) })}>
          <FanIcon /><span>Fan {state.fan}</span>
        </button>
        <button type="button" aria-pressed={state.sleep} className={state.sleep ? 'is-active' : ''}
          onClick={() => setDevice(id, { sleep: !state.sleep, eco: state.sleep ? state.eco : false })}>
          <MoonIcon /><span>Sleep</span>
        </button>
        <button type="button" aria-pressed={state.swing} className={state.swing ? 'is-active' : ''}
          onClick={() => setDevice(id, { swing: !state.swing })}>
          <WindIcon /><span>Swing</span>
        </button>
      </div>

      <p className="sh-note">
        {kasa
          ? <>Power runs through the Kasa device <b>{kasa.alias || kasa.id}</b>. Kasa plugs only switch power, so temperature and mode are set in the app and not sent to the AC.</>
          : <>Simulated. Link this AC to a Kasa plug under <button type="button" className="sh-link" onClick={() => showView({ name: 'link' })}>Devices</button> to switch its power for real.</>}
      </p>
    </div>
  );
}

function BridgeStatus({ s }) {
  const [token, setTokenDraft] = useState('');
  const { status, error, devices } = s.bridge;
  if (status === 'online') {
    return (
      <div className="sh-card">
        <div className="sh-card__row">
          <span><b>Bridge connected</b> · {devices.length} Kasa device{devices.length === 1 ? '' : 's'}</span>
          <button type="button" className="sh-btn" onClick={scanNetwork}><RadarIcon size={16} /> Scan</button>
        </div>
      </div>
    );
  }
  if (status === 'unauthorized') {
    return (
      <form className="sh-card" onSubmit={(e) => { e.preventDefault(); saveToken(token); }}>
        <b>The bridge needs its access token</b>
        <p>Enter the <code>BRIDGE_TOKEN</code> the bridge was started with. It's saved in this browser only.</p>
        <div className="sh-card__row">
          <input type="password" value={token} onChange={(e) => setTokenDraft(e.target.value)} placeholder="Bridge token" aria-label="Bridge token" />
          <button type="submit" className="sh-btn">Connect</button>
        </div>
      </form>
    );
  }
  return (
    <div className="sh-card">
      <b>{status === 'checking' ? 'Looking for the Kasa bridge…' : 'No Kasa bridge found'}</b>
      <p>
        Every device is simulated until the bridge is running on a computer on your home Wi-Fi.
        See <code>bridge/README.md</code>: <code>python bridge/kasa_bridge.py</code>, then reload.
      </p>
      {error && status === 'offline' && <small className="is-offline">{error}</small>}
    </div>
  );
}

function LinkView({ s, rooms }) {
  const { devices: kasaDevices, mapping, status } = s.bridge;
  const used = new Set(Object.values(mapping));
  const unlinked = kasaDevices.filter((d) => !used.has(d.id));
  return (
    <div className="sh-body">
      <div className="sh-ac__top">
        <button type="button" className="sh-round" aria-label="Back" onClick={() => showView({ name: 'home' })}><BackIcon /></button>
        <div className="sh-ac__title"><strong>Devices</strong><span>Link each fixture to a Kasa plug, switch or bulb</span></div>
      </div>
      <BridgeStatus s={s} />

      {status === 'online' && rooms.map((room) => {
        const devices = DEVICES.filter((d) => d.room === room.id);
        if (!devices.length) return null;
        return (
          <section key={room.id} className="sh-room">
            <h3>{room.name}</h3>
            {devices.map((d) => (
              <div key={d.id} className="sh-row sh-row--link">
                <div className="sh-row__icon">{d.kind === 'light' ? <BulbIcon /> : <SnowIcon />}</div>
                <span className="sh-row__text"><span>{d.name}</span></span>
                <select
                  value={mapping[d.id] || ''}
                  aria-label={`Kasa device for ${room.name} ${d.name}`}
                  onChange={(e) => linkDevice(d.id, e.target.value)}
                >
                  <option value="">Not linked</option>
                  {mapping[d.id] && !kasaDevices.some((k) => k.id === mapping[d.id]) && (
                    <option value={mapping[d.id]}>Missing device</option>
                  )}
                  {kasaDevices.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.alias} · {k.model}{k.online ? '' : ' (offline)'}{used.has(k.id) && mapping[d.id] !== k.id ? ' (in use)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </section>
        );
      })}

      {status === 'online' && unlinked.length > 0 && (
        <section className="sh-room">
          <h3>Not linked yet</h3>
          {unlinked.map((k) => (
            <div key={k.id} className="sh-row sh-row--static">
              <div className="sh-row__icon"><PlugIcon /></div>
              <div className="sh-row__text"><span>{k.alias}</span><small>{k.model} · {k.type} · {k.host}</small></div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default function ControlPanel({ rooms }) {
  const s = useHome();
  let body;
  if (s.view.name === 'ac') body = <ACView key={s.view.id} s={s} id={s.view.id} />;
  else if (s.view.name === 'link') body = <LinkView s={s} rooms={rooms} />;
  else body = <HomeView s={s} rooms={rooms} />;
  return (
    <aside className="sh-panel">
      <Header s={s} />
      {body}
      {s.toast && <div className="sh-toast" role="status">{s.toast}</div>}
    </aside>
  );
}
