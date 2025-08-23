import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Clock, 
  QrCode, 
  Search, 
  Settings, 
  LogOut,
  RefreshCw,
  Bell,
  TrendingUp,
  Activity,
  Heart,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Download,
  Upload,
  BarChart3,
  PieChart,
  LineChart,
  Calendar as CalendarIcon,
  Stethoscope,
  FileText,
  CreditCard,
  Shield,
  Database,
  Zap,
  Star,
  Award,
  Target,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { QRScanner } from '../components/QRScanner';
import { PatientLookup } from '../components/PatientLookup';
import { PatientDetailModal } from '../components/PatientDetailModal';
import { SettingsPanel } from '../components/SettingsPanel';
import { AppointmentBooking } from '../components/AppointmentBooking';
import { AdvancedAnalytics } from '../components/AdvancedAnalytics';
import { useAuth } from '../hooks/useAuth';
import { useQueue } from '../hooks/useQueue';
import { useAnalytics } from '../hooks/useAnalytics';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { supabase } from '../lib/supabase';
import { parseQRCode, QRPayload } from '../lib/qr';
import { formatDate, formatTime, getStatusColor, getPaymentStatusColor } from '../lib/utils';
import { Visit, Patient, Analytics } from '../types';

export const AdminPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { visits, queueStatus, loading: queueLoading, refetch } = useQueue();
  const { analytics, loading: analyticsLoading } = useAnalytics();
  
  // State management
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showPatientLookup, setShowPatientLookup] = useState(false);
  const [showPatientDetail, setShowPatientDetail] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'patients' | 'analytics'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Real-time updates
  useRealTimeUpdates(() => {
    refetch();
    fetchNotifications();
  });

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
      setLastRefresh(new Date());
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_type', 'admin')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleQRScan = async (payload: QRPayload) => {
    setLoading(true);
    setError('');
    
    try {
      // Find the visit by QR payload
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .select(`
          *,
          patient:patients(*)
        `)
        .eq('qr_payload', JSON.stringify(payload))
        .single();

      if (visitError || !visit) {
        throw new Error('Invalid QR code or visit not found');
      }

      // Update visit status to checked_in
      const { error: updateError } = await supabase
        .from('visits')
        .update({ 
          status: 'checked_in',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', visit.id);

      if (updateError) throw updateError;

      // Create audit log
      await supabase
        .from('audit_logs')
        .insert({
          actor_id: user?.id,
          action_type: 'patient_checkin',
          action_payload: {
            visit_id: visit.id,
            patient_id: visit.patient_id,
            stn: visit.stn,
            department: visit.department
          },
          resource_type: 'visit',
          resource_id: visit.id
        });

      setSuccess(`Patient ${visit.patient?.name} (Token #${visit.stn}) checked in successfully!`);
      refetch();
      
    } catch (error: any) {
      console.error('QR scan error:', error);
      setError(error.message || 'Failed to process QR code');
    } finally {
      setLoading(false);
    }
  };

  const updateVisitStatus = async (visitId: string, status: string) => {
    setLoading(true);
    setError('');
    
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('visits')
        .update(updateData)
        .eq('id', visitId);

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_logs')
        .insert({
          actor_id: user?.id,
          action_type: 'status_update',
          action_payload: {
            visit_id: visitId,
            new_status: status
          },
          resource_type: 'visit',
          resource_id: visitId
        });

      setSuccess(`Visit status updated to ${status.replace('_', ' ')}`);
      refetch();
      
    } catch (error: any) {
      console.error('Status update error:', error);
      setError(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (visitId: string, paymentStatus: string) => {
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase
        .from('visits')
        .update({ 
          payment_status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', visitId);

      if (error) throw error;

      // Create payment transaction record
      if (paymentStatus === 'paid') {
        const visit = visits.find(v => v.id === visitId);
        if (visit) {
          await supabase
            .from('payment_transactions')
            .insert({
              visit_id: visitId,
              patient_id: visit.patient_id,
              amount: 500, // Default amount, should be dynamic
              payment_method: 'cash',
              status: 'completed',
              processed_by: user?.id,
              processed_at: new Date().toISOString()
            });
        }
      }

      setSuccess(`Payment status updated to ${paymentStatus.replace('_', ' ')}`);
      refetch();
      
    } catch (error: any) {
      console.error('Payment update error:', error);
      setError(error.message || 'Failed to update payment status');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredVisits = () => {
    let filtered = visits;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(visit => 
        visit.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.patient?.phone.includes(searchQuery) ||
        visit.stn.toString().includes(searchQuery)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(visit => visit.status === statusFilter);
    }

    // Department filter
    if (departmentFilter) {
      filtered = filtered.filter(visit => visit.department === departmentFilter);
    }

    // Date filter
    const today = new Date().toISOString().split('T')[0];
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(visit => visit.visit_date === today);
        break;
      case 'yesterday':
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        filtered = filtered.filter(visit => visit.visit_date === yesterday);
        break;
      case 'week':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        filtered = filtered.filter(visit => visit.visit_date >= weekAgo);
        break;
    }

    return filtered;
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const exportData = async (type: 'visits' | 'patients' | 'analytics') => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'visits':
          data = getFilteredVisits();
          filename = `visits-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'patients':
          const { data: patientsData } = await supabase
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false });
          data = patientsData || [];
          filename = `patients-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'analytics':
          data = analytics ? [analytics] : [];
          filename = `analytics-${new Date().toISOString().split('T')[0]}.json`;
          break;
      }

      if (data.length === 0) {
        setError('No data to export');
        return;
      }

      const csvContent = type === 'analytics' 
        ? JSON.stringify(data, null, 2)
        : convertToCSV(data);
      
      const blob = new Blob([csvContent], { 
        type: type === 'analytics' ? 'application/json' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      setSuccess(`${type} data exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export data');
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  // Login check
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to access the admin dashboard</p>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Admin Email"
                className="w-full"
              />
              <Input
                type="password"
                placeholder="Password"
                className="w-full"
              />
              <Button className="w-full" size="lg">
                Sign In
              </Button>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Demo credentials: admin@clinic.com / admin123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredVisits = getFilteredVisits();
  const todayStats = {
    totalVisits: visits.filter(v => v.visit_date === new Date().toISOString().split('T')[0]).length,
    completedVisits: visits.filter(v => v.status === 'completed' && v.visit_date === new Date().toISOString().split('T')[0]).length,
    waitingVisits: visits.filter(v => ['waiting', 'checked_in'].includes(v.status)).length,
    revenue: analytics?.today.revenue || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">MediQueue Admin</h1>
                  <p className="text-xs text-gray-500">Advanced Management Dashboard</p>
                </div>
              </div>
              
              {/* Live Status Indicator */}
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700 font-medium">LIVE</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Auto Refresh Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="auto-refresh" className="text-sm text-gray-600">
                  Auto ({refreshInterval}s)
                </label>
              </div>

              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No new notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => markNotificationRead(notification.id)}
                          >
                            <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatTime(notification.created_at)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetch();
                  setLastRefresh(new Date());
                }}
                disabled={queueLoading}
              >
                <RefreshCw className={`h-4 w-4 ${queueLoading ? 'animate-spin' : ''}`} />
              </Button>

              <span className="text-xs text-gray-500">
                Last: {formatTime(lastRefresh.toISOString())}
              </span>

              {/* Quick Actions */}
              <Button variant="outline" onClick={() => setShowQRScanner(true)} size="sm">
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR
              </Button>

              <Button variant="outline" onClick={() => setShowPatientLookup(true)} size="sm">
                <Search className="h-4 w-4 mr-2" />
                Find Patient
              </Button>

              <Button variant="outline" onClick={() => setShowSettings(true)} size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>

              <Button variant="outline" onClick={() => signOut()} size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Success/Error Messages */}
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-800">{success}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSuccess('')}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setError('')}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 bg-white rounded-t-lg shadow-sm">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: Activity, count: null },
                { key: 'queue', label: 'Live Queue', icon: Users, count: todayStats.waitingVisits },
                { key: 'patients', label: 'Patients', icon: UserCheck, count: todayStats.totalVisits },
                { key: 'analytics', label: 'Analytics', icon: BarChart3, count: null }
              ].map(({ key, label, icon: Icon, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                  {count !== null && (
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      activeTab === key 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Today's Visits</p>
                      <p className="text-3xl font-bold">{todayStats.totalVisits}</p>
                      <p className="text-blue-100 text-xs mt-1">
                        +{todayStats.completedVisits} completed
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-full p-3">
                      <Users className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Currently Waiting</p>
                      <p className="text-3xl font-bold">{todayStats.waitingVisits}</p>
                      <p className="text-green-100 text-xs mt-1">
                        Live queue count
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-full p-3">
                      <Clock className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Today's Revenue</p>
                      <p className="text-3xl font-bold">₹{todayStats.revenue.toFixed(0)}</p>
                      <p className="text-purple-100 text-xs mt-1">
                        Payment collections
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-full p-3">
                      <DollarSign className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Completion Rate</p>
                      <p className="text-3xl font-bold">
                        {todayStats.totalVisits > 0 ? Math.round((todayStats.completedVisits / todayStats.totalVisits) * 100) : 0}%
                      </p>
                      <p className="text-orange-100 text-xs mt-1">
                        Efficiency metric
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-full p-3">
                      <TrendingUp className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-xl">
              <CardHeader>
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                  Quick Actions
                </h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    onClick={() => setShowQRScanner(true)}
                    className="h-20 flex-col space-y-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <QrCode className="h-6 w-6" />
                    <span className="text-sm">Scan QR Code</span>
                  </Button>
                  
                  <Button
                    onClick={() => setShowAppointments(true)}
                    className="h-20 flex-col space-y-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <CalendarIcon className="h-6 w-6" />
                    <span className="text-sm">Appointments</span>
                  </Button>
                  
                  <Button
                    onClick={() => setShowPatientLookup(true)}
                    className="h-20 flex-col space-y-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  >
                    <Search className="h-6 w-6" />
                    <span className="text-sm">Find Patient</span>
                  </Button>
                  
                  <Button
                    onClick={() => setShowAnalytics(true)}
                    className="h-20 flex-col space-y-2 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-500" />
                    Recent Activity
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('queue')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {visits.slice(0, 5).map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">#{visit.stn}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{visit.patient?.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{visit.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
                          {visit.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{formatTime(visit.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Queue Management Tab */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            {/* Filters */}
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Input
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="md:col-span-2"
                  />
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: '', label: 'All Status' },
                      { value: 'waiting', label: 'Waiting' },
                      { value: 'checked_in', label: 'Checked In' },
                      { value: 'in_service', label: 'In Service' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'held', label: 'On Hold' }
                    ]}
                  />
                  <Select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    options={[
                      { value: '', label: 'All Departments' },
                      { value: 'general', label: 'General Medicine' },
                      { value: 'cardiology', label: 'Cardiology' },
                      { value: 'orthopedics', label: 'Orthopedics' },
                      { value: 'pediatrics', label: 'Pediatrics' }
                    ]}
                  />
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportData('visits')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Queue List */}
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    Live Queue ({filteredVisits.length})
                  </h3>
                  <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-700 font-medium">LIVE UPDATES</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredVisits.map((visit) => (
                    <div key={visit.id} className="border rounded-lg p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            #{visit.stn}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{visit.patient?.name}</h4>
                            <p className="text-sm text-gray-600">
                              {visit.patient?.phone} • Age: {visit.patient?.age}
                            </p>
                            <p className="text-sm text-gray-600 capitalize">
                              {visit.department} • {formatTime(visit.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-1 ${getStatusColor(visit.status)}`}>
                              {visit.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <br />
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(visit.payment_status)}`}>
                              {visit.payment_status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            {visit.status === 'waiting' && (
                              <Button
                                size="sm"
                                onClick={() => updateVisitStatus(visit.id, 'checked_in')}
                                disabled={loading}
                              >
                                Check In
                              </Button>
                            )}
                            
                            {visit.status === 'checked_in' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateVisitStatus(visit.id, 'in_service')}
                                disabled={loading}
                              >
                                Start Service
                              </Button>
                            )}
                            
                            {visit.status === 'in_service' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateVisitStatus(visit.id, 'completed')}
                                disabled={loading}
                              >
                                Complete
                              </Button>
                            )}
                            
                            {visit.payment_status === 'pay_at_clinic' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updatePaymentStatus(visit.id, 'paid')}
                                disabled={loading}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </div>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPatient(visit.patient_id);
                              setShowPatientDetail(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredVisits.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No patients in queue</h3>
                      <p>Patients will appear here as they book tokens.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Patient Management</h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => exportData('patients')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Patients
                    </Button>
                    <Button onClick={() => setShowPatientLookup(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Find Patient
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Management</h3>
                  <p className="text-gray-500 mb-4">Use the search function to find and manage patient records.</p>
                  <Button onClick={() => setShowPatientLookup(true)}>
                    <Search className="h-4 w-4 mr-2" />
                    Search Patients
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                    Advanced Analytics
                  </h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => exportData('analytics')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                    <Button onClick={() => setShowAnalytics(true)}>
                      <PieChart className="h-4 w-4 mr-2" />
                      Detailed View
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                  </div>
                ) : analytics ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h4 className="font-semibold text-blue-900 mb-2">Today's Performance</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-blue-700">Visits:</span>
                              <span className="font-bold text-blue-900">{analytics.today.total_visits}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Completed:</span>
                              <span className="font-bold text-blue-900">{analytics.today.completed_visits}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Revenue:</span>
                              <span className="font-bold text-blue-900">₹{analytics.today.revenue}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h4 className="font-semibold text-green-900 mb-2">Monthly Summary</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-green-700">Total Visits:</span>
                              <span className="font-bold text-green-900">{analytics.monthly.total_visits}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Revenue:</span>
                              <span className="font-bold text-green-900">₹{analytics.monthly.total_revenue}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Satisfaction:</span>
                              <span className="font-bold text-green-900">{analytics.monthly.patient_satisfaction}/5</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h4 className="font-semibold text-purple-900 mb-2">Top Departments</h4>
                          <div className="space-y-2">
                            {analytics.monthly.top_departments.slice(0, 3).map((dept, index) => (
                              <div key={dept.department} className="flex justify-between">
                                <span className="text-purple-700 capitalize">{dept.department}:</span>
                                <span className="font-bold text-purple-900">{dept.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
                    <p>Analytics will appear as data is collected.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Modals */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />

      <PatientLookup
        isOpen={showPatientLookup}
        onClose={() => setShowPatientLookup(false)}
      />

      {selectedPatient && (
        <PatientDetailModal
          isOpen={showPatientDetail}
          onClose={() => {
            setShowPatientDetail(false);
            setSelectedPatient('');
          }}
          patientId={selectedPatient}
        />
      )}

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <AppointmentBooking
        isOpen={showAppointments}
        onClose={() => setShowAppointments(false)}
      />

      <AdvancedAnalytics
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />

      {/* Credits Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-600">
            <p>
              Developed by{' '}
              <a 
                href="https://instagram.com/aftabxplained" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                Aftab Alam [ASOSE Lajpat Nagar]
              </a>
              {' '}| Follow on Instagram:{' '}
              <a 
                href="https://instagram.com/aftabxplained" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                @aftabxplained
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};