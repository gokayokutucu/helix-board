export type ColumnId = 'backlog' | 'todo' | 'in-progress' | 'done';

export interface WorkItem {
  id: string;
  key: string;
  title: string;
  status: ColumnId;
  dueDate: string;
  priority?: 'high' | 'medium' | 'low';
  assignees: Array<{
    initials: string;
    color: string;
  }>;
}

export const workItems: WorkItem[] = [
  {
    id: '1',
    key: 'ENA 14',
    title: 'Audit user data to shortlist ideal case studies',
    status: 'backlog',
    dueDate: '15 Apr, 2025',
    assignees: [
      { initials: 'JD', color: 'bg-blue-600' },
      { initials: 'SK', color: 'bg-purple-600' },
    ],
  },
  {
    id: '2',
    key: 'CON 20',
    title: 'Interview product and design for behind-the-scenes content',
    status: 'backlog',
    dueDate: '20 Apr, 2025',
    assignees: [
      { initials: 'MR', color: 'bg-green-600' },
      { initials: 'AL', color: 'bg-orange-600' },
    ],
  },
  {
    id: '3',
    key: 'CON 24',
    title: 'Benchmark competitor feature launches for positioning ideas',
    status: 'backlog',
    dueDate: '17 Apr, 2025',
    assignees: [
      { initials: 'TW', color: 'bg-pink-600' },
      { initials: 'NK', color: 'bg-indigo-600' },
    ],
  },
  {
    id: '4',
    key: 'DES 42',
    title: 'Mock up in-app spotlight banner for launch week',
    status: 'backlog',
    dueDate: '05 May, 2025',
    assignees: [{ initials: 'RG', color: 'bg-teal-600' }],
  },
  {
    id: '5',
    key: 'CON 51',
    title: 'Draft product messaging for homepage hero refresh',
    status: 'todo',
    dueDate: '14 Apr, 2025',
    priority: 'high',
    assignees: [{ initials: 'JD', color: 'bg-blue-600' }],
  },
  {
    id: '6',
    key: 'DES 65',
    title: 'Storyboard launch explainer video with use-case examples',
    status: 'todo',
    dueDate: '5 May, 2025',
    assignees: [
      { initials: 'MK', color: 'bg-cyan-600' },
      { initials: 'PL', color: 'bg-amber-600' },
    ],
  },
  {
    id: '7',
    key: 'CAM 80',
    title: 'Prep tailored drip emails for power users vs. dormant accounts',
    status: 'in-progress',
    dueDate: '16 Mar, 2025',
    assignees: [{ initials: 'SB', color: 'bg-purple-600' }],
  },
  {
    id: '8',
    key: 'CON 75',
    title: 'Write long-form blog: "How smart auto-campaigns boost engagement"',
    status: 'in-progress',
    dueDate: '17 Mar, 2025',
    assignees: [{ initials: 'TK', color: 'bg-green-600' }],
  },
  {
    id: '9',
    key: 'DES 32',
    title: 'Create walkthrough carousel for in-app announcement',
    status: 'in-progress',
    dueDate: '20 Mar, 2025',
    assignees: [{ initials: 'LH', color: 'bg-red-600' }],
  },
  {
    id: '10',
    key: 'ENA 37',
    title: 'QA UTM tracking across email, in-app, and web CTA buttons',
    status: 'in-progress',
    dueDate: '24 Mar, 2025',
    assignees: [{ initials: 'DM', color: 'bg-orange-600' }],
  },
  {
    id: '11',
    key: 'ENA 39',
    title: 'Coordinate with CS team to flag ideal accounts for targeted outreach',
    status: 'in-progress',
    dueDate: '20 Mar, 2025',
    assignees: [{ initials: 'FW', color: 'bg-blue-600' }],
  },
  {
    id: '12',
    key: 'CAM 70',
    title: 'Finalized launch comms calendar across all channels',
    status: 'done',
    dueDate: '8 Mar, 2025',
    assignees: [
      { initials: 'JD', color: 'bg-blue-600' },
      { initials: 'MR', color: 'bg-purple-600' },
    ],
  },
  {
    id: '13',
    key: 'DES 33',
    title: 'Uploaded App Store screenshots with updated feature highlights',
    status: 'done',
    dueDate: '16 Feb, 2025',
    assignees: [
      { initials: 'RG', color: 'bg-teal-600' },
      { initials: 'NK', color: 'bg-pink-600' },
    ],
  },
  {
    id: '14',
    key: 'CAM 75',
    title: 'Set up landing page A/B test with control vs. new messaging',
    status: 'done',
    dueDate: '28 Feb, 2025',
    assignees: [{ initials: 'AL', color: 'bg-green-600' }],
  },
  {
    id: '15',
    key: 'CAM 76',
    title: 'Published teaser post on LinkedIn via founder account',
    status: 'done',
    dueDate: '4 Mar, 2025',
    assignees: [
      { initials: 'SB', color: 'bg-purple-600' },
      { initials: 'TW', color: 'bg-indigo-600' },
    ],
  },
];
