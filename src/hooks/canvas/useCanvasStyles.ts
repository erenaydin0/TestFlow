import { useMemo } from 'react';

interface CanvasStylesParams {
  zoom: number;
  pan: { x: number; y: number };
  canvasOffset: { x: number; y: number };
  isPanning: boolean;
}

interface CanvasStyles {
  canvasContainer: React.CSSProperties;
  innerContainer: React.CSSProperties;
  svgLayer: React.CSSProperties;
}

const useCanvasStyles = ({
  zoom,
  pan,
  canvasOffset,
  isPanning
}: CanvasStylesParams): CanvasStyles => {
  return useMemo(() => ({
    canvasContainer: {
      width: '100%',
      height: '100%',
      position: 'relative' as const,
      cursor: isPanning ? 'grabbing' : 'grab',
      backgroundImage: `
        radial-gradient(circle, var(--border-primary) 1px, transparent 1px)
      `,
      backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
      backgroundPosition: `${pan.x}px ${pan.y}px`,
      transform: `scale(${zoom})`,
      transformOrigin: 'center center'
    },
    innerContainer: {
      transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
      transformOrigin: '0 0',
      width: '100%',
      height: '100%',
      position: 'relative' as const
    },
    svgLayer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none' as const,
      zIndex: 1
    }
  }), [zoom, pan.x, pan.y, canvasOffset.x, canvasOffset.y, isPanning]);
};

export default useCanvasStyles; 