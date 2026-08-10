import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { TIMELINE, type TimelineEvent } from '../data/timeline';

export default function Timeline() {
  const { isDark } = useStore();

  return (
    <div className={cn('min-h-screen pb-16 transition-colors', isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900')}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold tracking-tight">我的时间轴</h1>
          <p className={cn('mt-3 text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
            从4岁半到23岁 · 一些值得记住的时刻
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className={cn('text-2xl font-semibold', isDark ? 'text-amber-400' : 'text-amber-500')}>4</span>
              <span className={cn(isDark ? 'text-gray-500' : 'text-gray-400')}>岁</span>
            </div>
            <div className={cn('h-px w-16', isDark ? 'bg-gray-800' : 'bg-gray-200')} />
            <div className="flex items-center gap-2">
              <span className={cn('text-2xl font-semibold', isDark ? 'text-emerald-400' : 'text-emerald-500')}>23</span>
              <span className={cn(isDark ? 'text-gray-500' : 'text-gray-400')}>岁</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className={cn(
            'absolute left-6 top-0 bottom-0 w-px md:left-1/2 md:-translate-x-px',
            isDark ? 'bg-gray-800' : 'bg-gray-200'
          )} />

          {/* Events */}
          <div className="space-y-12">
            {TIMELINE.map((event, i) => (
              <TimelineItem
                key={event.id}
                event={event}
                index={i}
                isDark={isDark}
              />
            ))}
          </div>

          {/* End dot */}
          <div className="relative mt-16">
            <div className={cn(
              'absolute left-6 md:left-1/2 md:-translate-x-1/2 w-4 h-4 rounded-full',
              isDark ? 'bg-gray-800' : 'bg-gray-200'
            )} />
            <div className="pl-12 md:pl-0 md:text-center">
              <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-gray-400')}>
                故事还在继续…
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ event, index, isDark }: { event: TimelineEvent; index: number; isDark: boolean }) {
  const isLeft = index % 2 === 0;

  return (
    <div className="relative flex items-start">
      {/* Dot */}
      <div className={cn(
        'absolute left-6 md:left-1/2 md:-translate-x-1/2 z-10 w-4 h-4 rounded-full ring-4',
        isDark ? 'ring-gray-950' : 'ring-gray-50',
        `bg-gradient-to-br ${event.color}`
      )} />

      {/* Card */}
      <div className={cn(
        'pl-16 md:pl-0',
        'md:w-1/2',
        isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12 md:ml-auto'
      )}>
        <div className={cn(
          'rounded-2xl p-6 border transition-all hover:-translate-y-0.5 hover:shadow-lg',
          isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-100 hover:border-gray-200'
        )}>
          {/* Age & Year */}
          <div className={cn('flex items-center gap-3 mb-3', isLeft ? 'md:flex-row-reverse' : '')}>
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r',
              event.color
            )}>
              {event.age}岁
            </span>
            <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
              {event.year}年
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold mb-2">
            <span className="mr-2">{event.icon}</span>
            {event.title}
          </h3>

          {/* Description */}
          <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-400' : 'text-gray-600')}>
            {event.description}
          </p>
        </div>
      </div>
    </div>
  );
}
