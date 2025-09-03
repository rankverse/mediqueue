import React from 'react';
import { Clock, Users, TrendingUp, Activity } from 'lucide-react';
import { useQueue } from '../hooks/useQueue';
import { useTranslation } from '../lib/translations';
import { estimateWaitTime } from '../lib/utils';

interface QueueWidgetProps {
  userSTN?: number;
  department?: string;
}

export const QueueWidget: React.FC<QueueWidgetProps> = ({ userSTN, department }) => {
  const { t } = useTranslation();
  const { queueStatus, loading } = useQueue(department);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse shadow-md mb-8">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded-lg w-32"></div>
          <div className="h-6 bg-gray-200 rounded-lg w-20"></div>
        </div>
      </div>
    );
  }

  const userPosition = userSTN ? Math.max(0, userSTN - queueStatus.now_serving) : 0;
  const estimatedWait = estimateWaitTime(userPosition);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-md">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <Activity className="h-6 w-6 text-teal-600 mr-2" />
          Live Queue Status
        </h3>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-gray-600">Real-time updates • Refreshed every 15 seconds</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-teal-50 rounded-xl p-4 shadow-sm border border-teal-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-teal-100 rounded-full p-2">
              <Clock className="h-6 w-6 text-teal-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-teal-900 mb-1">{queueStatus.now_serving}</div>
          <div className="text-sm font-medium text-teal-700">{t('now_serving')}</div>
          <div className="text-xs text-teal-500 mt-1">Current Token</div>
        </div>
        
        <div className="bg-orange-50 rounded-xl p-4 shadow-sm border border-orange-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-orange-100 rounded-full p-2">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-900 mb-1">{queueStatus.total_waiting}</div>
          <div className="text-sm font-medium text-orange-700">{t('waiting')}</div>
          <div className="text-xs text-orange-500 mt-1">In Queue</div>
        </div>

        {userSTN && (
          <>
            <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-green-100 rounded-full p-2">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-green-900 mb-1">{userSTN}</div>
              <div className="text-sm font-medium text-green-700">{t('your_token')}</div>
              <div className="text-xs text-green-500 mt-1">Your Number</div>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-4 shadow-sm border border-purple-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-purple-100 rounded-full p-2">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-900 mb-1">{estimatedWait}m</div>
              <div className="text-sm font-medium text-purple-700">{t('est_wait')}</div>
              <div className="text-xs text-purple-500 mt-1">Approximate</div>
            </div>
          </>
        )}
      </div>

      {userSTN && userPosition > 0 && (
        <div className="mt-6 pt-6 border-t-2 border-gray-200">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-gray-700 font-medium">{t('position_in_queue')}</span>
              <span className="font-bold text-teal-900 text-lg">#{userPosition}</span>
            </div>
            <div className="mt-3 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-teal-500 to-green-500 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, ((queueStatus.now_serving - 1) / userSTN) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Started</span>
              <span className="font-medium">Your Turn</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};