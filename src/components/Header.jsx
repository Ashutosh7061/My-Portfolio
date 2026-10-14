import { useEffect, useState } from 'react';

const rand = (a, b) => Math.floor(a + Math.random() * (b - a));

export default function Header() {
  // purely decorative numbers, labelled "simulated" so nobody mistakes them for real stats
  const [m, setM] = useState({ rps: 1284, p99: 42 });

  useEffect(() => {
    const t = setInterval(
      () =>
        setM((p) => ({
          rps: Math.max(900, p.rps + rand(-60, 70)),
          p99: Math.min(80, Math.max(18, p.p99 + rand(-4, 5))),
        })),
      1200
    );
    return () => clearInterval(t);
  }, []);

  return (
    <header className="site-header">
      <h1>Ashutosh Raj</h1>
      <p>
        <span className="dot" />
        Backend developer · 200 OK · open to work
      </p>
      <ul className="metrics" aria-hidden="true">
        <li><b>{m.rps.toLocaleString()}</b> req/s</li>
        <li><b>{m.p99}ms</b> p99</li>
        <li><b>99.98%</b> uptime</li>
        <li className="sim">simulated</li>
      </ul>
    </header>
  );
}