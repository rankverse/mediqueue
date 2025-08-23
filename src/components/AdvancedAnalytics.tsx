import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  TrendingUp, 
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Activity,
  Calendar,
  Target,
  Award,
  Zap,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { supabase } from '../lib/supabase';
import { formatDate, formatCurrency } from '../lib/utils';

interface AdvancedAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AnalyticsData {
  overview: {
    totalPatients: number;
    totalVisits: number;
    totalRevenue: number;
    averageWaitTime: number;
    completionRate: number;
    patientSatisfaction: number;
  };
  trends: {
    dailyVisits: { date: string; visits: number; revenue: number }[];
    departmentStats: { department: string; visits: number; revenue: number; avgWaitTime: number }[];
    hourlyDistribution: { hour: number; visits: number }[];
    paymentMethods: { method: string; count: number; amount: number }[];
  };
  performance: {
    topDoctors: { name: string; visits: number; rating: number }[];
    busyHours: { hour: string; load: number }[];
    departmentEfficiency: { department: string; efficiency: number }[];
  };
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ isOpen, onClose }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('7days');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [activeView, setActiveView] = useState<'overview' | 'trends' | 'performance'>('overview');
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchAnalyticsData();
      fetchDepartments();
    }
  }, [isOpen, dateRange, selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('name, display_name')
        .eq('is_active', true);

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch visits data
      let visitsQuery = supabase
        .from('visits')
        .select(`
          *,
          patient:patients(*),
          doctor:doctors(*),
          payment_transactions(*)
        `)
        .gte('visit_date', startDateStr)
        .lte('visit_date', endDateStr);

      if (selectedDepartment !== 'all') {
        visitsQuery = visitsQuery.eq('department', selectedDepartment);
      }

      const { data: visits, error: visitsError } = await visitsQuery;
      if (visitsError) throw visitsError;

      // Fetch patients data
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (patientsError) throw patientsError;

      // Process data
      const processedData = processAnalyticsData(visits || [], patients || []);
      setAnalyticsData(processedData);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (visits: any[], patients: any[]): AnalyticsData => {
    // Overview calculations
    const totalVisits = visits.length;
    const completedVisits = visits.filter(v => v.status === 'completed');
    const totalRevenue = visits.reduce((sum, visit) => {
      const transactions = visit.payment_transactions || [];
      return sum + transactions.reduce((tSum: number, t: any) => 
        t.status === 'completed' ? tSum + parseFloat(t.amount) : tSum, 0);
    }, 0);

    const avgWaitTime = completedVisits.length > 0 ? 
      completedVisits.reduce((sum, visit) => {
        if (visit.checked_in_at && visit.created_at) {
          const waitTime = new Date(visit.checked_in_at).getTime() - new Date(visit.created_at).getTime();
          return sum + (waitTime / (1000 * 60)); // Convert to minutes
        }
        return sum;
      }, 0) / completedVisits.length : 0;

    const completionRate = totalVisits > 0 ? (completedVisits.length / totalVisits) * 100 : 0;

    // Daily trends
    const dailyVisits = visits.reduce((acc: any, visit) => {
      const date = visit.visit_date;
      if (!acc[date]) {
        acc[date] = { visits: 0, revenue: 0 };
      }
      acc[date].visits++;
      
      const transactions = visit.payment_transactions || [];
      acc[date].revenue += transactions.reduce((sum: number, t: any) => 
        t.status === 'completed' ? sum + parseFloat(t.amount) : sum, 0);
      
      return acc;
    }, {});

    const dailyTrends = Object.entries(dailyVisits).map(([date, data]: [string, any]) => ({
      date,
      visits: data.visits,
      revenue: data.revenue
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Department stats
    const departmentStats = visits.reduce((acc: any, visit) => {
      const dept = visit.department;
      if (!acc[dept]) {
        acc[dept] = { visits: 0, revenue: 0, totalWaitTime: 0, waitTimeCount: 0 };
      }
      acc[dept].visits++;
      
      const transactions = visit.payment_transactions || [];
      acc[dept].revenue += transactions.reduce((sum: number, t: any) => 
        t.status === 'completed' ? sum + parseFloat(t.amount) : sum, 0);

      if (visit.checked_in_at && visit.created_at) {
        const waitTime = new Date(visit.checked_in_at).getTime() - new Date(visit.created_at).getTime();
        acc[dept].totalWaitTime += (waitTime / (1000 * 60));
        acc[dept].waitTimeCount++;
      }
      
      return acc;
    }, {});

    const departmentTrends = Object.entries(departmentStats).map(([department, data]: [string, any]) => ({
      department: department.charAt(0).toUpperCase() + department.slice(1),
      visits: data.visits,
      revenue: data.revenue,
      avgWaitTime: data.waitTimeCount > 0 ? data.totalWaitTime / data.waitTimeCount : 0
    }));

    // Hourly distribution
    const hourlyStats = visits.reduce((acc: any, visit) => {
      const hour = new Date(visit.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      visits: hourlyStats[hour] || 0
    }));

    // Payment methods
    const paymentStats = visits.reduce((acc: any, visit) => {
      const transactions = visit.payment_transactions || [];
      transactions.forEach((transaction: any) => {
        const method = transaction.payment_method;
        if (!acc[method]) {
          acc[method] = { count: 0, amount: 0 };
        }
        acc[method].count++;
        if (transaction.status === 'completed') {
          acc[method].amount += parseFloat(transaction.amount);
        }
      });
      return acc;
    }, {});

    const paymentMethods = Object.entries(paymentStats).map(([method, data]: [string, any]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      count: data.count,
      amount: data.amount
    }));

    // Performance metrics
    const doctorStats = visits.reduce((acc: any, visit) => {
      if (visit.doctor) {
        const doctorId = visit.doctor.id;
        if (!acc[doctorId]) {
          acc[doctorId] = {
            name: visit.doctor.name,
            visits: 0,
            completedVisits: 0
          };
        }
        acc[doctorId].visits++;
        if (visit.status === 'completed') {
          acc[doctorId].completedVisits++;
        }
      }
      return acc;
    }, {});

    const topDoctors = Object.values(doctorStats).map((doctor: any) => ({
      name: doctor.name,
      visits: doctor.visits,
      rating: doctor.visits > 0 ? (doctor.completedVisits / doctor.visits) * 5 : 0
    })).sort((a: any, b: any) => b.visits - a.visits).slice(0, 5);

    return {
      overview: {
        totalPatients: patients.length,
        totalVisits,
        totalRevenue,
        averageWaitTime: avgWaitTime,
        completionRate,
        patientSatisfaction: 4.2 // Mock data
      },
      trends: {
        dailyVisits: dailyTrends,
        departmentStats: departmentTrends,
        hourlyDistribution,
        paymentMethods
      },
      performance: {
        topDoctors,
        busyHours: [
          { hour: '9-10 AM', load: 85 },
          { hour: '10-11 AM', load: 92 },
          { hour: '11-12 PM', load: 78 },
          { hour: '2-3 PM', load: 88 },
          { hour: '3-4 PM', load: 95 }
        ],
        departmentEfficiency: departmentTrends.map(dept => ({
          department: dept.department,
          efficiency: dept.visits > 0 ? Math.min(100, (dept.visits / 10) * 100) : 0
        }))
      }
    };
  };

  const exportAnalytics = () => {
    if (!analyticsData) return;

    const exportData = {
      generatedAt: new Date().toISOString(),
      dateRange,
      department: selectedDepartment,
      data: analyticsData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advanced Analytics Dashboard" size="xl">
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              options={[
                { value: '7days', label: 'Last 7 Days' },
                { value: '30days', label: 'Last 30 Days' },
                { value: '90days', label: 'Last 90 Days' },
                { value: '1year', label: 'Last Year' }
              ]}
            />
            <Select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              options={[
                { value: 'all', label: 'All Departments' },
                ...departments.map(dept => ({
                  value: dept.name,
                  label: dept.display_name
                }))
              ]}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalyticsData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAnalytics}
              disabled={!analyticsData}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'trends', label: 'Trends', icon: LineChart },
              { key: 'performance', label: 'Performance', icon: Target }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeView === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          ) : analyticsData ? (
            <>
              {/* Overview Tab */}
              {activeView === 'overview' && (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-700">Total Patients</p>
                            <p className="text-2xl font-bold text-blue-900">{analyticsData.overview.totalPatients}</p>
                          </div>
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-700">Total Visits</p>
                            <p className="text-2xl font-bold text-green-900">{analyticsData.overview.totalVisits}</p>
                          </div>
                          <Activity className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-700">Total Revenue</p>
                            <p className="text-2xl font-bold text-purple-900">₹{analyticsData.overview.totalRevenue.toFixed(0)}</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-700">Avg Wait Time</p>
                            <p className="text-2xl font-bold text-orange-900">{analyticsData.overview.averageWaitTime.toFixed(0)}m</p>
                          </div>
                          <Clock className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-700">Completion Rate</p>
                            <p className="text-2xl font-bold text-red-900">{analyticsData.overview.completionRate.toFixed(1)}%</p>
                          </div>
                          <Target className="h-8 w-8 text-red-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-yellow-700">Satisfaction</p>
                            <p className="text-2xl font-bold text-yellow-900">{analyticsData.overview.patientSatisfaction.toFixed(1)}/5</p>
                          </div>
                          <Award className="h-8 w-8 text-yellow-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Department Performance */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Department Performance</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.trends.departmentStats.map((dept) => (
                          <div key={dept.department} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900">{dept.department}</h4>
                              <p className="text-sm text-gray-600">{dept.visits} visits • ₹{dept.revenue.toFixed(0)} revenue</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">{dept.avgWaitTime.toFixed(0)}m avg wait</p>
                              <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, (dept.visits / 20) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Trends Tab */}
              {activeView === 'trends' && (
                <div className="space-y-6">
                  {/* Daily Trends */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Daily Trends</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.trends.dailyVisits.slice(-7).map((day) => (
                          <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900">{formatDate(day.date)}</h4>
                              <p className="text-sm text-gray-600">{day.visits} visits</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-600">₹{day.revenue.toFixed(0)}</p>
                              <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, (day.visits / 50) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Hourly Distribution */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Hourly Distribution</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-6 gap-2">
                        {analyticsData.trends.hourlyDistribution.filter(h => h.visits > 0).map((hour) => (
                          <div key={hour.hour} className="text-center p-2 bg-blue-50 rounded">
                            <p className="text-xs font-medium text-blue-900">{hour.hour}:00</p>
                            <p className="text-sm font-bold text-blue-700">{hour.visits}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Methods */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Payment Methods</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analyticsData.trends.paymentMethods.map((method) => (
                          <div key={method.method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900">{method.method}</h4>
                              <p className="text-sm text-gray-600">{method.count} transactions</p>
                            </div>
                            <p className="font-bold text-green-600">₹{method.amount.toFixed(0)}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Performance Tab */}
              {activeView === 'performance' && (
                <div className="space-y-6">
                  {/* Top Doctors */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Top Performing Doctors</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.performance.topDoctors.map((doctor, index) => (
                          <div key={doctor.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">Dr. {doctor.name}</h4>
                                <p className="text-sm text-gray-600">{doctor.visits} patients treated</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full ${
                                      i < Math.floor(doctor.rating) ? 'bg-yellow-400' : 'bg-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{doctor.rating.toFixed(1)}/5</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Busy Hours */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Peak Hours</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analyticsData.performance.busyHours.map((hour) => (
                          <div key={hour.hour} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900">{hour.hour}</h4>
                            <div className="flex items-center space-x-3">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    hour.load > 90 ? 'bg-red-500' :
                                    hour.load > 70 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${hour.load}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700">{hour.load}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Department Efficiency */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Department Efficiency</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analyticsData.performance.departmentEfficiency.map((dept) => (
                          <div key={dept.department} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900">{dept.department}</h4>
                            <div className="flex items-center space-x-3">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${dept.efficiency}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700">{dept.efficiency.toFixed(0)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p>Analytics data will appear once visits are recorded.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};