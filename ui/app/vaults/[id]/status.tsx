import { Button } from '@/components/shadcn/Button';

export const StatusPhase: IComponent<{
  start: number;
  end: number;
  vaultId: string;
}> = () => {
  return (
    <Button variant="outline" className="bg-orange-400">
      Deposit
    </Button>
  );
};
