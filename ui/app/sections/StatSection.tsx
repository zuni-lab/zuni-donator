// TODO: fetch onchain data
export const StatSection: IComponent = () => {
  return (
    <section className="mt-8">
      <div className="mt-4 w-full grid grid-cols-4 gap-4">
        <StatItem title="Users using the platform" value={1000} />
        <StatItem title="Vaults created" value={92} />
        <StatItem title="Attestations made by users" value={1500} />
        <StatItem title="Total  successful withdrawals" value={334} />
      </div>
    </section>
  );
};

const StatItem: IComponent<{
  title: string;
  value: string | number;
}> = ({ title, value }) => {
  return (
    <div className="flex flex-col items-center gap-4 statItem">
      <p className="value">{value}</p>
      <p className="text-xl text-center">{title}</p>
    </div>
  );
};
