import { useEffect, useMemo } from 'react';

import { debounce } from 'lodash';

function usePageVisibility(onVisibilityChange: () => void): void {
  const debouncedVisibilityChange = useMemo(() => debounce(onVisibilityChange, 500), [onVisibilityChange]);

  useEffect(() => {
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        debouncedVisibilityChange();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);

    return (): void => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [debouncedVisibilityChange]);
}

export default usePageVisibility;
