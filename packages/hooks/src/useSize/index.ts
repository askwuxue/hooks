// import ResizeObserver from 'resize-observer-polyfill';
import { ResizeObserver } from '@juggle/resize-observer';
import useRafState from '../useRafState';
import type { BasicTarget } from '../utils/domTarget';
import { getTargetElement } from '../utils/domTarget';
import useIsomorphicLayoutEffectWithTarget from '../utils/useIsomorphicLayoutEffectWithTarget';

type Size = { width: number; height: number };
interface ResizeObserverOptions {
  box?: 'content-box' | 'border-box' | 'device-pixel-content-box';
}

function useSize(
  target: BasicTarget,
  options: ResizeObserverOptions = { box: 'border-box' },
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

      // const resizeObserver = new ResizeObserver((entries) => {
      //   entries.forEach((entry) => {
      //     const { clientWidth, clientHeight } = entry.target;
      //     setState({ width: clientWidth, height: clientHeight });
      //   });
      // });

      const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const { clientWidth, clientHeight } = entry.target;
          setState({ width: clientWidth, height: clientHeight });
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
