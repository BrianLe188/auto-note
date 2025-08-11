import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";
import { Bell } from "lucide-react";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Auto Note</h1>
            </div>
            <span className="text-sm text-gray-500 hidden sm:inline">
              Meeting Automation Platform
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <img
                src={user?.profileImageUrl}
                className="h-8 w-8 rounded-full"
              />
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {user?.firstName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
