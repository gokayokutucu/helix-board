import { ChevronRight, LayoutList, LayoutGrid, Filter, Monitor, BarChart3, Plus } from 'lucide-react';
import { Button } from './ui/button';

export function MainHeader() {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-gray-700">
            <span>🚀</span>
            <span className="font-medium">Auto-campaigns launch</span>
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">Work items</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-md divide-x divide-gray-200">
            <button className="p-2 hover:bg-gray-50">
              <LayoutList className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-50 bg-gray-50">
              <LayoutGrid className="w-4 h-4 text-gray-900" />
            </button>
          </div>

          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>

          <Button variant="outline" size="sm" className="gap-2">
            <Monitor className="w-4 h-4" />
            Display
          </Button>

          <Button variant="outline" size="sm" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Button>

          <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add work item
          </Button>
        </div>
      </div>
    </div>
  );
}
