import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shadcn/Tooltip';

export const TooltipWrapper: IComponent<{
  text: string;
}> = ({ text, children }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild className="cursor-pointer">
          {children}
        </TooltipTrigger>
        <TooltipContent>{text} </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
