import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import type { TimelineEvent } from '../types';

export default function Timeline() {
  const timelineEvents = useStore((s) => s.timelineEvents);

  useEffect(() => {
    useStore.getState().fetchTimeline();
  }, []);

  const sorted = [...timelineEvents].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="min-h-screen pb-16 transition-colors bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold tracking-tight">我的时间轴</h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            从4岁半到23岁 · 一些值得记住的时刻
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-amber-500 dark:text-amber-400">4</span>
              <span className="text-gray-400 dark:text-gray-500">岁</span>
            </div>
            <div className="h-px w-16 bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-emerald-500 dark:text-emerald-400">23</span>
              <span className="text-gray-400 dark:text-gray-500">岁</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px md:left-1/2 md:-translate-x-px bg-gray-200 dark:bg-gray-800" />

          {/* Events */}
          <div className="space-y-12">
            {sorted.map((event, i) => (
              <TimelineItem
                key={event.id}
                event={event}
                index={i}
              />
            ))}
          </div>

          {/* End dot */}
          <div className="relative mt-16">
            <div className="absolute left-6 md:left-1/2 md:-translate-x-1/2 w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="pl-12 md:pl-0 md:text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                故事还在继续…
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ event, index }: { event: TimelineEvent; index: number }) {
  const isLeft = index % 2 === 0;

  return (
    <div className="relative flex items-start">
      {/* Dot */}
      <div className={cn(
        'absolute left-6 md:left-1/2 md:-translate-x-1/2 z-10 w-4 h-4 rounded-full ring-4',
        'ring-gray-50 dark:ring-gray-950',
        `bg-gradient-to-br ${event.color}`
      )} />

      {/* Card */}
      <div className={cn(
        'pl-16 md:pl-0',
        'md:w-1/2',
        isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12 md:ml-auto'
      )}>
        <div className="rounded-2xl p-6 border transition-all hover:-translate-y-0.5 hover:shadow-lg bg-white border-gray-100 hover:border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-gray-700">
          {/* Age & Year */}
          <div className={cn('flex items-center gap-3 mb-3', isLeft ? 'md:flex-row-reverse' : '')}>
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r',
              event.color
            )}>
              {event.age}岁
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {event.year}年
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold mb-2">
            <span className="mr-2">{event.icon}</span>
            {event.title}
          </h3>

          {/* Description */}
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {event.description}
          </p>
        </div>
      </div>
    </div>
  );
}
