import { StatusPhase } from './status';
import { TableTxs } from './txs';

export default function Detail() {
  return (
    <main className="p-20">
      <h1 className="text-4xl font-bold">Greenland funding</h1>
      <div className="flex items-center justify-end">
        <StatusPhase />
      </div>
      <TableTxs />
    </main>
  );
}
