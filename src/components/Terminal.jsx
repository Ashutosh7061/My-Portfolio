import { useEffect, useRef, useState } from 'react';

export default function Terminal({ lines, sections, active, onRun, onOpen }) {
  const outRef = useRef(null);
  const [value, setValue] = useState('');
  const history = useRef([]);
  const cursor = useRef(0);

  useEffect(() => {
    outRef.current.scrollTop = outRef.current.scrollHeight;
  }, [lines]);

  const submit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      history.current.push(value);
      cursor.current = history.current.length;
    }
    onRun(value);
    setValue('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowUp' && cursor.current > 0) {
      cursor.current -= 1;
      setValue(history.current[cursor.current]);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      cursor.current = Math.min(history.current.length, cursor.current + 1);
      setValue(history.current[cursor.current] || '');
      e.preventDefault();
    }
  };

  return (
    <section className="term" aria-label="Terminal">
      <div className="bar">
        <i /><i /><i />
        <span>ashutosh@api-gateway: ~</span>
      </div>

      <div className="out" ref={outRef} role="log" aria-live="polite">
        {lines.map((l, i) => (
          <div key={i} className={l.cls} dangerouslySetInnerHTML={{ __html: l.html }} />
        ))}
      </div>

      <div className="chips">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            className={active === s.id ? 'on' : ''}
            onClick={() => onOpen(s.id)}
          >
            {s.id}
          </button>
        ))}
      </div>

      <form className="in" onSubmit={submit} autoComplete="off">
        <span>$</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="type help"
          aria-label="Terminal command"
          spellCheck={false}
          autoCapitalize="off"
        />
      </form>
    </section>
  );
}