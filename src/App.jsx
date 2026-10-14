import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Scene from './components/Scene.jsx';
import Terminal from './components/Terminal.jsx';
import { RACKS, SECTIONS } from './data/portfolio.js';
import { escapeHtml, jsonToLines } from './utils/formatJson.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const BOOT = [
  { html: '<span class="ok">[ok]</span> api-gateway listening on :443' },
  { html: `<span class="ok">[ok]</span> ${RACKS.length} racks online, ${SECTIONS.length} services healthy` },
  { html: '<span class="ok">[ok]</span> cooling nominal · 21°C · no alerts' },
  { html: 'Click a server, tap a chip below, or type help.', cls: 'dim' },
];

const HELP = [
  'commands:',
  '  ls              list endpoints',
  '  open &lt;name&gt;    call an endpoint (also: cat, curl)',
  '  whoami          about me',
  '  contact         how to reach me',
  '  clear           clear the screen',
].map((html) => ({ html, cls: 'dim' }));

export default function App() {
  const sceneRef = useRef(null);
  const timer = useRef(null);
  const [lines, setLines] = useState(BOOT);
  const [active, setActive] = useState(null);

  const push = useCallback((line) => setLines((prev) => [...prev, line]), []);

  // Prints lines one at a time to look like a streaming response.
  const typeLines = useCallback((list) => {
    clearInterval(timer.current);
    if (reduceMotion) return list.forEach(push);
    let i = 0;
    timer.current = setInterval(() => {
      if (i >= list.length) return clearInterval(timer.current);
      push(list[i++]);
    }, 28);
  }, [push]);

  useEffect(() => () => clearInterval(timer.current), []);

  const open = useCallback((id) => {
    const section = SECTIONS.find((s) => s.id === id);
    if (!section) return false;
    setActive(id);
    push({ html: escapeHtml(`$ curl -s api.ashutosh.dev/${id}`) });
    const ms = 10 + Math.floor(Math.random() * 38);
    sceneRef.current?.open(id, () => {
      push({ html: `HTTP/1.1 200 OK · ${ms}ms`, cls: 'ok' });
      typeLines(jsonToLines(section.data).map((html) => ({ html })));
    });
    return true;
  }, [push, typeLines]);

  const onPick = useCallback((id) => (id ? open(id) : setActive(null)), [open]);

  const run = (raw) => {
    const input = raw.trim();
    if (!input) return;
    push({ html: escapeHtml(`$ ${input}`) });
    const [cmd, ...rest] = input.toLowerCase().split(/\s+/);
    const arg = (rest[0] || '').replace(/^\/+/, '');
    const dim = (html) => push({ html, cls: 'dim' });

    if (cmd === 'help') HELP.forEach(push);
    else if (cmd === 'ls') dim(SECTIONS.map((s) => `/${s.id}`).join('   '));
    else if (cmd === 'whoami') open('about');
    else if (cmd === 'contact') open('contact');
    else if (cmd === 'clear') setLines([]);
    else if (['open', 'cat', 'curl', 'get'].includes(cmd)) {
      if (!arg) dim('usage: open &lt;name&gt;. Try ls.');
      else if (!open(arg)) dim(`404 Not Found: /${escapeHtml(arg)}. Try ls.`);
    } else dim(`command not found: ${escapeHtml(cmd)}. Type help.`);
  };

  return (
    <>
      <Scene ref={sceneRef} sections={SECTIONS} racks={RACKS} onPick={onPick} />
      <Header />
      <p className="hint">drag to rotate · scroll to zoom · click a server</p>
      <Terminal lines={lines} sections={SECTIONS} active={active} onRun={run} onOpen={open} />
    </>
  );
}