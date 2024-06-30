import uniqueId from 'lodash/uniqueId';
import { MutableRefObject, useEffect, useRef, useState } from 'react';

const delay = (time: number) => new Promise((res) => setTimeout(res, time));

/**
 * Collections of timeoutID for debounceHook
 */
const timeoutIDs: { [key: string]: ReturnType<typeof setTimeout> | null } = {};

/**
 * Make an action that limted calling after threshold time
 */
const useActionThreshold = (
  /**
   * Delay between calls
   */
  threshold = 500,
  /**
   * Only trigger once if true
   */
  once = false
): {
  onAction: (action: () => Promise<void> | void) => Promise<void>;
  refresh: () => void;
} => {
  const [ready, setReady] = useState(true);
  /**
   * Call each time user make an actions to update ready state
   * @param {function} action
   */
  const onAction = async (action: () => Promise<void> | void): Promise<void> => {
    if (!ready) {
      return;
    }
    setReady(false);
    await action();
    if (once) {
      return;
    }
    await delay(threshold);
    setReady(true);
  };

  /**
   * Refresh hook to ready state
   */
  const refresh = (): void => setReady(true);

  return { onAction, refresh };
};

/**
 * Make an action that have been debounce each given time
 * @param debounceTime Delay after call
 * @param clearWhenCallAgain Renew current timeout if true
 */
const useActionDebounce = (
  debounceTime = 500,
  clearWhenCallAgain = false
): ((_action: () => Promise<void> | void) => void) => {
  /**
   * @type action
   */

  // eslint-disable-next-line @typescript-eslint/ban-types
  let action: Function | null;
  const [id] = useState(uniqueId('debounce_'));

  /**
   * Call current stored action
   */
  const doAction = async (): Promise<void> => {
    if (typeof action === 'function') {
      await action();
    }
    const timeOut = timeoutIDs[id];
    if (timeOut) {
      clearTimeout(timeOut);
      timeoutIDs[id] = null;
    }
    action = null;
  };

  /**
   * On receive action
   * @param _action
   */
  const onAction = (
    _action: () => Promise<void> | void = async (): Promise<void> => undefined
  ): void => {
    action = _action;
    if (clearWhenCallAgain) {
      const timeOut = timeoutIDs[id];
      if (timeOut) {
        clearTimeout(timeOut);
      }
      timeoutIDs[id] = setTimeout(() => doAction(), debounceTime);
    } else if (timeoutIDs[id] === null) {
      timeoutIDs[id] = setTimeout(() => doAction(), debounceTime);
    }
  };
  return onAction;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useOverflowDetection: (deps: any) => [MutableRefObject<HTMLDivElement | null>, boolean] = (
  deps
) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      const container = containerRef.current;
      if (container) {
        const hasOverflow = container.scrollHeight > container.clientHeight;
        setIsOverflowing(hasOverflow);
      }
    };

    checkOverflow(); // Initial check
    window.addEventListener('resize', checkOverflow); // Recheck on window resize

    return () => {
      window.removeEventListener('resize', checkOverflow); // Cleanup listener
    };
  }, [deps]); // Re-run effect when dependencies change

  return [containerRef, isOverflowing];
};

export { useActionDebounce, useActionThreshold, useOverflowDetection };
