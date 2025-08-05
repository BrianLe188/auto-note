import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import FileUpload from "@/components/file-upload";
import TranscriptionProgress from "@/components/transcription-progress";
import MeetingList from "@/components/meeting-list";
import ActionItems from "@/components/action-items";
import ABTesting from "@/components/ab-testing";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Bell } from "lucide-react";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("upload");

  // Fetch dashboard stats
  const { data: stats } = useQuery<{
    meetingsTranscribed: number;
    actionItems: number;
    hoursSaved: number;
  }>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">TranscribeAI</h1>
              </div>
              <span className="text-sm text-gray-500 hidden sm:inline">Meeting Automation Platform</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">SM</span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">Sarah Miller</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
              stats={stats}
            />
          </div>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-8">
            {activeTab === "upload" && (
              <>
                <FileUpload />
                <TranscriptionProgress />
              </>
            )}
            
            {activeTab === "meetings" && <MeetingList />}
            {activeTab === "action-items" && <ActionItems />}
            {activeTab === "ab-testing" && <ABTesting />}

            {(activeTab === "upload" || activeTab === "meetings") && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <MeetingList limit={3} />
                  <ActionItems limit={4} />
                </div>
                <ABTesting />
              </>
            )}

            {/* Search & Filter Bar */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      type="text" 
                      placeholder="Search meetings, transcripts, or action items..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Meetings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Meetings</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="processing">In Progress</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </Button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
