import { useEffect } from 'react';
import { TestStep } from '@/types';

interface UseMouseEventsParams {
  selectionIsSelecting: boolean;
  isPanning: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  canvasOffset: { x: number; y: number };
  panStart: { x: number; y: number };
  testSteps: TestStep[];
  selectionHandleCanvasMouseMove: (
    e: MouseEvent,
    canvasRef: React.RefObject<HTMLDivElement | null>,
    zoom: number,
    canvasOffset: { x: number; y: number },
    isPanning: boolean,
    panStart: { x: number; y: number },
    setPan: (pan: { x: number; y: number }) => void,
    setCanvasOffset: (offset: { x: number; y: number }) => void,
    testSteps: TestStep[],
    setSelectedSteps: (steps: Set<string>) => void
  ) => void;
  selectionHandleCanvasMouseUp: (
    e: MouseEvent,
    setIsPanning: (panning: boolean) => void
  ) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  setSelectedSteps: (steps: Set<string>) => void;
  setIsPanning: (panning: boolean) => void;
}

const useMouseEvents = ({
  selectionIsSelecting,
  isPanning,
  canvasRef,
  zoom,
  canvasOffset,
  panStart,
  testSteps,
  selectionHandleCanvasMouseMove,
  selectionHandleCanvasMouseUp,
  setPan,
  setCanvasOffset,
  setSelectedSteps,
  setIsPanning
}: UseMouseEventsParams) => {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      selectionHandleCanvasMouseMove(
        e,
        canvasRef,
        zoom,
        canvasOffset,
        isPanning,
        panStart,
        setPan,
        setCanvasOffset,
        testSteps,
        setSelectedSteps
      );
    };

    const handleMouseUp = (e: MouseEvent) => {
      selectionHandleCanvasMouseUp(e, setIsPanning);
    };

    if (selectionIsSelecting || isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [
    selectionIsSelecting,
    isPanning,
    canvasRef,
    zoom,
    canvasOffset,
    panStart,
    testSteps,
    selectionHandleCanvasMouseMove,
    selectionHandleCanvasMouseUp,
    setPan,
    setCanvasOffset,
    setSelectedSteps,
    setIsPanning
  ]);
};

export default useMouseEvents;
