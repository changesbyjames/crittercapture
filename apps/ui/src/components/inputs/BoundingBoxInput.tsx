import { FC, useEffect, useRef } from 'react';

export interface InputProps<T> {
  onChange: (value: T | ((value: T) => T)) => void;
  value: T;
}

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoundingBoxWorkingCopy extends BoundingBox {
  origin: {
    canvas: {
      x: number;
      y: number;
    };
    inner?: {
      x: number;
      y: number;
    };
  };
}

const getStyleForBox = (box: BoundingBox) => {
  return {
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`
  };
};

const applyBoundingBoxToElement = (element: HTMLDivElement, box: BoundingBox) => {
  if (!box) {
    const reset = getStyleForBox({ id: 'empty', x: 0, y: 0, width: 0, height: 0 });
    Object.assign(element.style, reset);
    return;
  }
  const style = getStyleForBox(box);
  Object.assign(element.style, style);
};

const clickIsInsideBox = (box: BoundingBox, x: number, y: number) => {
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
};

const updateBoxPositionFromMousePosition = (box: BoundingBoxWorkingCopy, x: number, y: number) => {
  if (!box.origin.inner) {
    throw new Error('Box origin inner is undefined');
  }
  return {
    ...box,
    x: Math.min(1 - box.width, Math.max(0, x - box.origin.inner.x)),
    y: Math.min(1 - box.height, Math.max(0, y - box.origin.inner.y))
  };
};

const updateBoxSizeFromMousePosition = (box: BoundingBoxWorkingCopy, x: number, y: number) => {
  const newX = Math.min(box.origin.canvas.x, x);
  const newY = Math.min(box.origin.canvas.y, y);

  const newWidth = Math.min(1, Math.max(0, Math.abs(x - box.origin.canvas.x)));
  const newHeight = Math.min(1, Math.max(0, Math.abs(y - box.origin.canvas.y)));

  return {
    ...box,
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight
  };
};

export const BoundingBoxInput: FC<InputProps<BoundingBox[]>> = ({ onChange, value }) => {
  const pending = useRef<BoundingBoxWorkingCopy | null>(null);
  const pendingBoxRef = useRef<HTMLDivElement | null>(null);

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      console.log('No ref!');
      return;
    }
    const abortController = new AbortController();

    node.addEventListener(
      'mousedown',
      e => {
        if (pending.current) {
          console.log('Already have a pending box, ignoring click');
          return;
        }
        const rect = node.getBoundingClientRect();
        // Boxes are normalised to be 0-1 for all dimensions
        const origin = {
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height
        };

        try {
          const box = value.reverse().find(box => clickIsInsideBox(box, origin.x, origin.y));
          if (box) {
            // Where the click is in relation to the box
            const inner = {
              x: origin.x - box.x,
              y: origin.y - box.y
            };

            pending.current = {
              ...box,
              origin: { canvas: origin, inner }
            };

            const clickedBoxElement = node.querySelector(`[data-id="${box.id}"]`) as HTMLDivElement | null;
            if (clickedBoxElement) clickedBoxElement.style.opacity = '0';
            return;
          }

          pending.current = {
            id: crypto.randomUUID(),
            x: origin.x,
            y: origin.y,
            width: 0,
            height: 0,
            origin: {
              canvas: origin
            }
          };
        } finally {
          applyBoundingBoxToElement(pendingBoxRef.current!, pending.current!);
          e.stopPropagation();
          e.preventDefault();
        }
      },
      { signal: abortController.signal }
    );

    node.addEventListener(
      'mousemove',
      e => {
        const box = pending.current;
        if (!box) return;

        const rect = node.getBoundingClientRect();
        try {
          const point = {
            x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
            y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
          };

          // Check if the inner is in any of the corners, if it is
          // go into resize mode from a corner origin.

          if (box.origin.inner) {
            // If it was grabbed from the inside, then we want to update the position.
            pending.current = updateBoxPositionFromMousePosition(box, point.x, point.y);
            return;
          }

          // Otherwise, we are in resize mode.
          pending.current = updateBoxSizeFromMousePosition(box, point.x, point.y);
        } finally {
          applyBoundingBoxToElement(pendingBoxRef.current!, pending.current!);
        }
      },
      { signal: abortController.signal }
    );

    node.addEventListener(
      'mouseup',
      () => {
        console.log('Mouse up');
        console.log(pending.current);
        if (!pending.current) return;
        if (pending.current.width < 0.01 || pending.current.height < 0.01) {
          pending.current = null;
          return;
        }

        onChange(value => {
          if (!value) return [pending.current!];
          return [...value.filter(box => box.id !== pending.current!.id), pending.current!];
        });
        applyBoundingBoxToElement(pendingBoxRef.current!, pending.current!);
        const clickedBoxElement = node.querySelector(`[data-id="${pending.current!.id}"]`) as HTMLDivElement | null;
        if (clickedBoxElement) clickedBoxElement.style.opacity = '1';
        pending.current = null;
      },
      { signal: abortController.signal }
    );

    return () => abortController.abort();
  }, [onChange, value]);

  return (
    <div ref={ref} className="absolute inset-0 z-40">
      <div ref={pendingBoxRef} className="absolute bg-red-50"></div>
      {value.map(box => (
        <div
          key={`${box.id}-${box.x}-${box.y}`}
          data-id={box.id}
          style={getStyleForBox(box)}
          className="absolute bg-red-500"
        ></div>
      ))}
    </div>
  );
};
