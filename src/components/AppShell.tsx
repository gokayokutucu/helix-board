import { Sidebar } from './Sidebar';
import { MainHeader } from './MainHeader';
import { Board } from './Board';

export function AppShell() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainHeader />
        <Board />
      </div>
    </div>
  );
}
