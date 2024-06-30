import { Copy } from 'lucide-react';
import { CopyToClipboard } from '../CopyToClipboard';

export const VaultAttesters: IComponent<{
  attesters: THexString[];
}> = ({ attesters }) => {
  return (
    <div>
      <h3 className="text-white font-semibold text-lg">Valid attesters:</h3>
      {attesters.length === 0 && (
        <div className="text-gray-400 mt-1 flex items-center gap-2"> - No attesters</div>
      )}
      {attesters.map((attester, index) => (
        <div key={index} className="text-gray-400 mt-1 flex items-center gap-2 px-2">
          <span className="bg-accent rounded-2xl py-1 px-2">{attester}</span>
          <CopyToClipboard text={attester}>
            <Copy size={16} />
          </CopyToClipboard>
        </div>
      ))}
    </div>
  );
};
