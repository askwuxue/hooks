import { ResizeObserver } from '@juggle/resize-observer';
import useRafState from '../useRafState';
import type { BasicTarget } from '../utils/domTarget';
import { getTargetElement } from '../utils/domTarget';
import useIsomorphicLayoutEffectWithTarget from '../utils/useIsomorphicLayoutEffectWithTarget';

type Size = { width: number; height: number };

type ResizeObserverBoxOptions = 'border-box' | 'content-box' | 'device-pixel-content-box';

interface ResizeObserverOptions {
  box?: ResizeObserverBoxOptions;
}

const ResizeObserverBoxMap = new Map<ResizeObserverBoxOptions, string>([
  ['border-box', 'borderBoxSize'],
  ['content-box', 'contentBoxSize'],
  ['device-pixel-content-box', 'devicePixelContentBoxSize'],
]);

const defaultObserverBox = 'border-box';

function useSize(
  target: BasicTarget,
  options: ResizeObserverOptions = { box: defaultObserverBox },
): Size | undefined {
  const [state, setState] = useRafState<Size | undefined>(() => {
    const el = getTargetElement(target);
    return el ? { width: el.clientWidth, height: el.clientHeight } : undefined;
  });

  useIsomorphicLayoutEffectWithTarget(
    () => {
      const el = getTargetElement(target);

      if (!el) {
        return;
      }

      const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const boxMap =
            ResizeObserverBoxMap.get(options.box as ResizeObserverBoxOptions) ||
            ResizeObserverBoxMap.get(defaultObserverBox)!;
          const [size] = entry[boxMap];
          const { inlineSize, blockSize } = size;
          setState({ width: inlineSize, height: blockSize });
        });
      });

      resizeObserver.observe(el, options);
      return () => {
        resizeObserver.disconnect();
      };
    },
    [],
    target,
  );

  return state;
}

export default useSize;
