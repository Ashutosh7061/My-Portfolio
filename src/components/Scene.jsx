import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import ServerRoom from '../three/ServerRoom.js';

// Mounts the three.js scene and exposes open() / retract() to the parent.
const Scene = forwardRef(function Scene({ sections, racks, onPick }, ref) {
  const canvasRef = useRef(null);
  const labelsRef = useRef(null);
  const roomRef = useRef(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    const room = new ServerRoom({
      canvas: canvasRef.current,
      labels: labelsRef.current,
      sections,
      racks,
      onPick: (id) => pickRef.current(id),
    });
    roomRef.current = room;
    return () => room.dispose();
  }, [sections, racks]);

  useImperativeHandle(ref, () => ({
    open: (id, cb) => roomRef.current?.open(id, cb) ?? false,
    retract: () => roomRef.current?.retract(),
  }), []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="scene"
        aria-label="3D server room. Each server is a section of the portfolio. Use the terminal to browse."
      />
      <div ref={labelsRef} />
    </>
  );
});

export default Scene;