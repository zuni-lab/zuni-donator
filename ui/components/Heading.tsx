import { cx } from '@/utils/tools';

export const Heading: IComponent<{
  title: string;
  description?: string;
  tiltleClassName?: string;
  size?: 'lg' | 'md' | 'sm';
}> = ({ title, description, size = 'lg', tiltleClassName }) => {
  return (
    <div className='flex flex-col items-center gap-8'>
      <h1
        className={cx(
          'font-bold text-center',
          size === 'lg' && 'text-7xl',
          size === 'md' && 'text-6xl',
          size === 'sm' && 'text-5xl',
          tiltleClassName
        )}>
        {title}
      </h1>
      <p className="text-xl text-center w-[600px]">{description}</p>
    </div>
  );
};
