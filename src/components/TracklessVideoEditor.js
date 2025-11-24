import React, { useState } from 'react';
import { Button } from './ui/button';

const TracklessVideoEditor = () => {
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <div className="bg-[#0F1A21] text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Trackless Video</h1>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={activeTab === "templates" ? "default" : "outline"}
              onClick={() => setActiveTab("templates")}
              className={activeTab === "templates" ? "bg-[#1E97A0] hover:bg-[#157a82]" : "bg-white text-[#0F1A21]"}
            >
              Templates
            </Button>
            <Button
              variant={activeTab === "sequence" ? "default" : "outline"}
              onClick={() => setActiveTab("sequence")}
              className={activeTab === "sequence" ? "bg-[#1E97A0] hover:bg-[#157a82]" : "bg-white text-[#0F1A21]"}
            >
              Sequence
            </Button>
            <Button
              variant={activeTab === "render" ? "default" : "outline"}
              onClick={() => setActiveTab("render")}
              className={activeTab === "render" ? "bg-[#1E97A0] hover:bg-[#157a82]" : "bg-white text-[#0F1A21]"}
            >
              Render Jobs
            </Button>
            <Button
              variant={activeTab === "management" ? "default" : "outline"}
              onClick={() => setActiveTab("management")}
              className={activeTab === "management" ? "bg-[#1E97A0] hover:bg-[#157a82]" : "bg-white text-[#0F1A21]"}
            >
              Management
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Custom Template Manager</h2>

              <div className="flex space-x-4 mb-6">
                <Button className="bg-[#1E97A0] hover:bg-[#157a82]">
                  Create Custom Template
                </Button>
                <Button variant="outline" className="border-[#1E97A0] text-[#1E97A0]">
                  Create from Current
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Placeholder for template cards */}
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="font-semibold">Template 1</h3>
                  <p className="text-sm text-gray-600">Description here</p>
                </div>
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="font-semibold">Template 2</h3>
                  <p className="text-sm text-gray-600">Description here</p>
                </div>
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="font-semibold">Template 3</h3>
                  <p className="text-sm text-gray-600">Description here</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Template Selection</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Placeholder for template options */}
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="font-semibold">Default Template</h3>
                  <p className="text-sm text-gray-600">Standard layout template</p>
                </div>
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="font-semibold">Split Screen</h3>
                  <p className="text-sm text-gray-600">Two video split layout</p>
                </div>
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="font-semibold">Picture-in-Picture</h3>
                  <p className="text-sm text-gray-600">Main video with smaller overlay</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sequence Tab */}
        {activeTab === "sequence" && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Video Sequence Display</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Select Videos from Device
                </label>
                <Button variant="outline" className="w-full border-dashed border-2 border-gray-300">
                  + Add Videos
                </Button>
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Video 1</h3>
                      <p className="text-sm text-gray-600">Duration: 10s</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">In/Out</Button>
                      <Button size="sm" variant="outline">Audio</Button>
                      <Button size="sm" variant="outline">Volume</Button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Video 2</h3>
                      <p className="text-sm text-gray-600">Duration: 15s</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">In/Out</Button>
                      <Button size="sm" variant="outline">Audio</Button>
                      <Button size="sm" variant="outline">Volume</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Render Jobs Tab */}
        {activeTab === "render" && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Render Jobs</h2>

              <div className="mb-4">
                <Button className="bg-[#A01E25] hover:bg-[#80171e]">
                  Start New Render
                </Button>
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Project Render #1</h3>
                      <p className="text-sm text-gray-600">Status: Processing</p>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                        <div className="bg-[#1E97A0] h-2.5 rounded-full" style={{width: '45%'}}></div>
                      </div>
                      <span className="text-sm">45%</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Project Render #2</h3>
                      <p className="text-sm text-gray-600">Status: Completed</p>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                        <div className="bg-[#A01E25] h-2.5 rounded-full" style={{width: '100%'}}></div>
                      </div>
                      <span className="text-sm">100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Management Tab */}
        {activeTab === "management" && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Video Management</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Saved Projects</h3>
                  <div className="space-y-2">
                    <div className="border rounded-lg p-3 bg-white">
                      <h4 className="font-medium">Project 1</h4>
                      <p className="text-sm text-gray-600">Last modified: Today</p>
                    </div>
                    <div className="border rounded-lg p-3 bg-white">
                      <h4 className="font-medium">Project 2</h4>
                      <p className="text-sm text-gray-600">Last modified: 2 days ago</p>
                    </div>
                    <div className="border rounded-lg p-3 bg-white">
                      <h4 className="font-medium">Project 3</h4>
                      <p className="text-sm text-gray-600">Last modified: 1 week ago</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Export Options</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      Export Project JSON
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Export Template
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Share Project
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Download Final Video
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TracklessVideoEditor;