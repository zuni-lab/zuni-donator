// const [progress, setProgress] = React.useState(13)

import { getForrmattedFullDate } from '@/utils/tools';
import { useEffect, useState } from 'react';
import { Progress } from '../shadcn/Progress';

export const VaultProgress: IComponent<{
  start: number;
  end: number;
}> = ({ start, end }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const updateProgress = () => {
      const now = Date.now();
      if (start === 0 || end === 0) {
        setProgress(0);
        return;
      }
      if (now < start) {
        setProgress(0);
      } else if (now > end) {
        setProgress(100);
      } else {
        const totalDuration = end - start;
        const elapsed = now - start;
        const progressPercentage = (elapsed / totalDuration) * 100;
        setProgress(progressPercentage);
      }
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000); // Update every second

    return () => clearInterval(interval); // Clean up interval on unmount
  }, [start, end]);

  return (
    <div className="w-full flex flex-wrap justify-between items-center gap-2">
      <div className="font-semibold">
        <span className="text-gray-200 text-lg">Contribute start</span>
        <div className="text-gray-400">
          {start === 0 ? 'N/A' : getForrmattedFullDate(Number(start))} (UTC)
        </div>
      </div>
      <div className="font-semibold text-right">
        <span className="text-gray-200 text-lg">Contribute end</span>
        <div className="text-gray-400">
          {end === 0 ? 'N/A' : getForrmattedFullDate(Number(end))} (UTC)
        </div>
      </div>
      <div className="w-full">
        <Progress value={progress} className="w-full" />
      </div>
      <div className="flex justify-center w-full gap-1">
        <span>Progress: </span>
        <span className="text-gray-200 font-medium">{progress.toFixed(0)}%</span>
      </div>
    </div>
  );
};
