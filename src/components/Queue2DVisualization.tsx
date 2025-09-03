import React, { useEffect, useState } from 'react';
import { Clock, Users, TrendingUp, Activity, Star, Award, Stethoscope } from 'lucide-react';
import { DepartmentStats } from '../types';
import { Card, CardContent, CardHeader } from './ui/Card';

interface Queue2DVisualizationProps {
  departmentStats: DepartmentStats[];
  className?: string;
}

export const Queue2DVisualization: React.FC<Queue2DVisualizationProps> = ({ 
  departmentStats, 
  className = '' 
}) => {
  const [animationKey, setAnimationKey] = useState(0);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getQueueEmojis = (waitingCount: number) => {
    const emojis = ['👨‍⚕️', '👩‍⚕️', '🧑‍⚕️', '👨‍💼', '👩‍💼', '🧑‍💼', '👨‍🎓', '👩‍🎓', '🧑‍🎓', '👨‍🔬', '👩‍🔬', '🧑‍🔬'];
    const maxShow = Math.min(waitingCount, 12);
    const selectedEmojis = [];
    
    for (let i = 0; i < maxShow; i++) {
      selectedEmojis.push(emojis[i % emojis.length]);
    }
    
    return selectedEmojis;
  };

  const getDepartmentIcon = (deptName: string) => {
    const icons: { [key: string]: string } = {
      'general': '🏥',
      'cardiology': '❤️',
      'orthopedics': '🦴',
      'pediatrics': '👶',
      'dermatology': '🧴',
      'neurology': '🧠',
      'gynecology': '👩‍⚕️',
      'dentistry': '🦷'
    };
    return icons[deptName] || '🏥';
  };

  const getStatusMessage = (dept: DepartmentStats) => {
    if (dept.total_waiting === 0) {
      return { message: "No Queue - Walk In!", color: "text-green-600", bg: "bg-green-50" };
    } else if (dept.total_waiting <= 3) {
      return { message: "Short Queue - Quick Service", color: "text-teal-600", bg: "bg-teal-50" };
    } else if (dept.total_waiting <= 8) {
      return { message: "Moderate Queue - Book Now", color: "text-yellow-600", bg: "bg-yellow-50" };
    } else {
      return { message: "Busy - Plan Ahead", color: "text-red-600", bg: "bg-red-50" };
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departmentStats.map((dept, index) => {
          const queueEmojis = getQueueEmojis(dept.total_waiting);
          const isActive = dept.total_waiting > 0;
          const status = getStatusMessage(dept);
          const isSelected = selectedDept === dept.department;
          
          return (
            <Card 
              key={dept.department} 
              className={`transition-all duration-500 cursor-pointer hover:shadow-lg transform hover:-translate-y-1 border border-gray-200 ${
                isActive ? 'ring-2 ring-teal-200 shadow-md' : ''
              } ${isSelected ? 'ring-4 ring-teal-400 shadow-xl scale-105' : ''}`}
              onClick={() => setSelectedDept(isSelected ? null : dept.department)}
            >
              <CardHeader className="pb-3 bg-gray-50 rounded-t-lg border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getDepartmentIcon(dept.department)}</div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{dept.display_name}</h4>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        <Activity className="h-3 w-3 mr-1" />
                        {status.message}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-700 font-medium">LIVE</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Current Status */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-teal-50 rounded-lg p-3 text-center border border-teal-200">
                    <div className="text-xl font-bold text-teal-700">{dept.now_serving}</div>
                    <div className="text-xs text-teal-600 font-medium">Now Serving</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
                    <div className="text-xl font-bold text-orange-700">{dept.total_waiting}</div>
                    <div className="text-xs text-orange-600 font-medium">Waiting</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                    <div className="text-xl font-bold text-green-700">{dept.total_completed}</div>
                    <div className="text-xs text-green-600 font-medium">Done</div>
                  </div>
                </div>

                {/* Queue Visualization */}
                <div className="bg-gray-50 rounded-lg p-4 min-h-[140px] border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Live Queue
                    </span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                      ~{dept.average_wait_time}min avg
                    </span>
                  </div>
                  
                  {dept.total_waiting === 0 ? (
                    <div className="flex items-center justify-center h-20 text-gray-400">
                      <div className="text-center">
                        <div className="text-4xl mb-2">✨</div>
                        <div className="text-sm font-medium text-green-600">No Queue - Walk In!</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Current Patient */}
                      <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <span className="text-2xl">🏥</span>
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-green-800">
                            Serving Token #{dept.now_serving}
                          </span>
                          <div className="text-xs text-green-600">In consultation</div>
                        </div>
                        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          NOW
                        </div>
                      </div>
                      
                      {/* Waiting Queue */}
                      <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-yellow-800">Waiting Queue:</span>
                          <span className="text-xs text-yellow-600 bg-yellow-200 px-2 py-1 rounded-full">
                            {dept.total_waiting} patients
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {queueEmojis.map((emoji, emojiIndex) => (
                            <span
                              key={`${animationKey}-${emojiIndex}`}
                              className="text-2xl animate-bounce hover:scale-125 transition-transform cursor-pointer"
                              style={{
                                animationDelay: `${emojiIndex * 0.1}s`,
                                animationDuration: '2s'
                              }}
                              title={`Patient ${emojiIndex + 1}`}
                            >
                              {emoji}
                            </span>
                          ))}
                          {dept.total_waiting > 12 && (
                            <div className="flex items-center justify-center w-8 h-8 bg-yellow-200 rounded-full text-xs font-bold text-yellow-800">
                              +{dept.total_waiting - 12}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Department Stats */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                    <span className="text-gray-600">Doctors:</span>
                    <span className="font-semibold text-teal-600 flex items-center">
                      <Stethoscope className="h-3 w-3 mr-1" />
                      {dept.doctor_count}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                    <span className="text-gray-600">Efficiency:</span>
                    <span className="font-semibold text-green-600 flex items-center">
                      <Award className="h-3 w-3 mr-1" />
                      {dept.total_completed > 0 ? Math.round((dept.total_completed / (dept.total_completed + dept.total_waiting)) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-1000 bg-gradient-to-r from-teal-400 to-green-500"
                    style={{
                      width: `${Math.min(100, (dept.total_completed / Math.max(1, dept.total_completed + dept.total_waiting)) * 100)}%`
                    }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {departmentStats.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="text-center py-16">
            <div className="text-8xl mb-6">🏥</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Active Departments</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Departments will appear here once they're configured in the admin settings. 
              Contact your administrator to set up departments.
            </p>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 max-w-sm mx-auto">
              <p className="text-teal-800 text-sm">
                💡 <strong>Admin Tip:</strong> Go to Admin → Settings → Departments to add your first department.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="bg-gray-50 border border-gray-200">
        <CardContent className="pt-6">
          <h4 className="font-bold text-gray-900 mb-4 text-center text-lg">Queue Status Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Currently Serving</span>
            </div>
            <div className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium">Waiting in Queue</span>
            </div>
            <div className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
              <div className="w-4 h-4 bg-teal-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Active Department</span>
            </div>
            <div className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
              <span className="text-xl">👨‍⚕️👩‍⚕️</span>
              <span className="text-sm font-medium">Patients in Queue</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};