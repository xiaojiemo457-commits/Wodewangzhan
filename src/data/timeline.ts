export type TimelineEvent = {
  id: string;
  age: number;
  year: number;
  title: string;
  description: string;
  icon: string;
  color: string;
};

export const TIMELINE: TimelineEvent[] = [
  {
    id: 'event-1',
    age: 4,
    year: 2007,
    title: '学前时光',
    description: '4岁半，第一次走进幼儿园。哭了三天，后来爱上了那里的滑滑梯和中午的红豆汤。',
    icon: '🎒',
    color: 'from-amber-400 to-orange-400',
  },
  {
    id: 'event-2',
    age: 5,
    year: 2008,
    title: '上一年级了',
    description: '5岁，正式成为小学生。第一天背了新书包，坐第一排，积极举手发言，后来发现其实坐后面更自由。',
    icon: '📚',
    color: 'from-sky-400 to-blue-400',
  },
  {
    id: 'event-3',
    age: 12,
    year: 2015,
    title: '小学毕业',
    description: '六年级，和同学在校门口合影，互相写同学录。那时候以为，毕业后的暑假会很长很长。',
    icon: '🎓',
    color: 'from-violet-400 to-purple-400',
  },
  {
    id: 'event-4',
    age: 15,
    year: 2018,
    title: '中考',
    description: '初中三年，从懵懂到有点懂事。中考考了全班第一名，考完那天，感觉心里的石头终于落地了。',
    icon: '✏️',
    color: 'from-emerald-400 to-teal-400',
  },
  {
    id: 'event-5',
    age: 18,
    year: 2021,
    title: '高考，疫情推迟',
    description: '2020年疫情爆发，高考推迟一个月。戴口罩考试，汗湿了试卷。那一个月的等待，比三年还漫长。',
    icon: '📝',
    color: 'from-rose-400 to-pink-400',
  },
  {
    id: 'event-6',
    age: 18,
    year: 2021,
    title: '上大学',
    description: '考上了桂林的大学，没出省。初中高中就住校了，所以离家这件事，好像没那么难。带着对大学的好奇和向往，开始了新的四年。',
    icon: '🏫',
    color: 'from-indigo-400 to-blue-500',
  },
  {
    id: 'event-7',
    age: 21,
    year: 2024,
    title: '大学毕业',
    description: '21岁，本科毕业。四年一晃而过，从刚入学的懵懂少年到站在毕业典礼上，好像只是昨天的事。',
    icon: '🎓',
    color: 'from-cyan-400 to-sky-500',
  },
  {
    id: 'event-8',
    age: 22,
    year: 2025,
    title: '独自玩一年',
    description: '毕业后没有急着工作，一个人背着包去了几个地方。看了海，爬了山，也在出租屋里躺了很久。想清楚了一些事，也没完全想清楚。',
    icon: '🗺️',
    color: 'from-orange-400 to-amber-500',
  },
  {
    id: 'event-9',
    age: 23,
    year: 2026,
    title: '23岁',
    description: '现在。在一个普通的日子里，写下这些。未来还很长，故事还在继续。',
    icon: '🌱',
    color: 'from-lime-400 to-green-500',
  },
];
