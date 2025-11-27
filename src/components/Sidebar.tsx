import { Home, Inbox, User, FolderKanban, Users, Target, BarChart3, MoreHorizontal, Search, Plus } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';

export function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
          <div className="w-5 h-5 bg-white rounded" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
            <Plus className="w-4 h-4" />
            <span>New work item</span>
          </button>
        </div>

        <div className="px-3 py-2">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4">
          <SidebarSection>
            <SidebarItem icon={Home} label="Home" />
            <SidebarItem icon={Inbox} label="Inbox" />
            <SidebarItem icon={User} label="Your work" />
          </SidebarSection>

          <SidebarSection title="Workspace">
            <SidebarItem icon={FolderKanban} label="Projects" />
            <SidebarItem icon={Users} label="Teamspaces" />
            <SidebarItem icon={Target} label="Initiatives" />
            <SidebarItem icon={BarChart3} label="Dashboards" />
            <SidebarItem icon={MoreHorizontal} label="More" />
          </SidebarSection>

          <SidebarSection title="Teamspaces">
            <SidebarItem icon={Users} label="Marketing" />
          </SidebarSection>

          <SidebarSection title="Projects">
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600 rounded-full" />
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-900 bg-gray-50 rounded-md font-medium">
                <span>🚀</span>
                <span>Auto-campaigns launch</span>
              </button>
            </div>
            <div className="ml-6 mt-1 space-y-0.5">
              <ProjectSubItem label="Overview" />
              <ProjectSubItem label="Epics" />
              <ProjectSubItem label="Work items" active />
              <ProjectSubItem label="Cycles" />
              <ProjectSubItem label="Modules" />
              <ProjectSubItem label="Views" />
              <ProjectSubItem label="Pages" />
              <ProjectSubItem label="Intake" />
            </div>
          </SidebarSection>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-600 text-white text-xs">JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}

function SidebarSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      {title && (
        <div className="px-3 mb-1">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

function ProjectSubItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md ${
        active ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span>{label}</span>
    </button>
  );
}
