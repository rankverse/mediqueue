import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  QrCode, 
  Search, 
  CheckCircle,
  LogOut,
  Eye,
  CreditCard,
  Settings,
  BarChart3,
  UserSearch,
  TrendingUp,
  DollarSign,
  Stethoscope,
  Pill,
  Bed,
  Building2,
  Calendar,
  UserPlus,
  FileText,
  Bell,
  Activity,
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Save,
  Download,
  Printer,
  Shield,
  Heart,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { QRScanner } from '../components/QRScanner';
import { PatientLookup } from '../components/PatientLookup';
import { PatientDetailModal } from '../components/PatientDetailModal';
import { SettingsPanel } from '../components/SettingsPanel';
import { PharmacyManagement } from '../components/PharmacyManagement';
import { AdmissionManagement } from '../components/AdmissionManagement';
import { RoomManagement } from '../components/RoomManagement';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../hooks/useAuth';
import { useQueue } from '../hooks/useQueue';
import { useAnalytics } from '../hooks/useAnalytics';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { useTranslation } from '../lib/translations';
import { supabase } from '../lib/supabase';
import { Visit, Patient, PaymentTransaction } from '../types';
import { formatTime, formatRelativeTime, getStatusColor, getPaymentStatusColor } from '../lib/utils';
import { QRPayload, parseQRCode } from '../lib/qr';

export const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, signOut, loading: authLoading } = useAuth();
  const { visits, queueStatus, loading: queueLoading, refetch } = useQueue();
  const { analytics, loading: analyticsLoading } = useAnalytics();
  
  const [showScanner, setShowScanner] = useState(false);
  const [showPatientLookup, setShowPatientLookup] = useState(false);
  const [showPatientDetail, setShowPatientDetail] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [showPharmacy, setShowPharmacy] = useState(false);
  const [showAdmission, setShowAdmission] = useState(false);
  const [showRoomManagement, setShowRoomManagement] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(15);
  
  // New state for advanced features
  const [admissionRequests, setAdmissionRequests] = useState<any[]>([]);
  const [nurseCallRequests, setNurseCallRequests] = useState<any[]>([]);
  const [departmentReferrals, setDepartmentReferrals] = useState<any[]>([]);
  const [scheduledAppointments, setScheduledAppointments] = useState<any[]>([]);
  const [daycareBookings, setDaycareBookings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdmissionRequests, setShowAdmissionRequests] = useState(false);
  const [showNurseCallRequests, setShowNurseCallRequests] = useState(false);
  const [showDepartmentReferrals, setShowDepartmentReferrals] = useState(false);
  const [showScheduledAppointments, setShowScheduledAppointments] = useState(false);
  const [showDaycareBookings, setShowDaycareBookings] = useState(false);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      refetch();
      fetchAllAdminData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval, refetch]);

  // Real-time updates
  useRealTimeUpdates(() => {
    if (autoRefreshEnabled) {
      refetch();
      fetchAllAdminData();
    }
  });

  // Fetch all admin data
  const fetchAllAdminData = async () => {
    try {
      // Fetch admission requests
      const demoAdmissionRequests = [
        {
          id: '1',
          patient: {
            id: '1',
            name: 'John Doe',
            uid: 'CLN1-ABC123',
            age: 35,
            phone: '+91-9876543210'
          },
          doctor: {
            id: '1',
            name: 'Dr. Sarah Johnson',
            specialization: 'general'
          },
          admission_type: 'planned',
          ward_type: 'private',
          reason: 'Requires observation for chest pain',
          estimated_duration: 2,
          estimated_cost: 6000,
          status: 'pending',
          priority: 'normal',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          patient: {
            id: '2',
            name: 'Jane Smith',
            uid: 'CLN1-XYZ789',
            age: 28,
            phone: '+91-9876543211'
          },
          doctor: {
            id: '2',
            name: 'Dr. Michael Chen',
            specialization: 'cardiology'
          },
          admission_type: 'emergency',
          ward_type: 'icu',
          reason: 'Acute myocardial infarction',
          estimated_duration: 5,
          estimated_cost: 25000,
          status: 'pending',
          priority: 'urgent',
          created_at: new Date(Date.now() - 1800000).toISOString()
        }
      ];
      setAdmissionRequests(demoAdmissionRequests);

      // Fetch nurse call requests
      const demoNurseCallRequests = [
        {
          id: '1',
          doctor: {
            name: 'Dr. Sarah Johnson',
            room: 'Consultation Room 1'
          },
          patient: {
            name: 'John Doe',
            uid: 'CLN1-ABC123'
          },
          urgency: 'high',
          reason: 'Patient experiencing chest pain',
          room_number: 'Room 101',
          special_instructions: 'Bring cardiac monitor',
          status: 'pending',
          created_at: new Date(Date.now() - 300000).toISOString()
        }
      ];
      setNurseCallRequests(demoNurseCallRequests);

      // Fetch department referrals
      const demoDepartmentReferrals = [
        {
          id: '1',
          patient: {
            name: 'Alice Johnson',
            uid: 'CLN1-DEF456'
          },
          from_doctor: {
            name: 'Dr. Sarah Johnson',
            specialization: 'general'
          },
          to_department: 'cardiology',
          reason: 'Suspected heart condition',
          urgency: 'high',
          notes: 'Patient has irregular heartbeat',
          status: 'pending',
          created_at: new Date(Date.now() - 600000).toISOString()
        }
      ];
      setDepartmentReferrals(demoDepartmentReferrals);

      // Fetch scheduled appointments
      const demoScheduledAppointments = [
        {
          id: '1',
          patient: {
            name: 'Bob Wilson',
            uid: 'CLN1-GHI789',
            phone: '+91-9876543212'
          },
          doctor: {
            name: 'Dr. Michael Chen',
            specialization: 'cardiology'
          },
          appointment_date: '2025-01-20',
          appointment_time: '10:00',
          appointment_type: 'consultation',
          status: 'confirmed',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          patient: {
            name: 'Carol Davis',
            uid: 'CLN1-JKL012',
            phone: '+91-9876543213'
          },
          doctor: {
            name: 'Dr. Emily Rodriguez',
            specialization: 'orthopedics'
          },
          appointment_date: '2025-01-21',
          appointment_time: '14:30',
          appointment_type: 'follow_up',
          status: 'confirmed',
          created_at: new Date().toISOString()
        }
      ];
      setScheduledAppointments(demoScheduledAppointments);

      // Fetch daycare bookings
      const demoDaycareBookings = [
        {
          id: '1',
          patient: {
            name: 'David Brown',
            uid: 'CLN1-MNO345',
            phone: '+91-9876543214'
          },
          daycare_type: 'observation',
          duration_hours: 8,
          booking_date: '2025-01-18',
          status: 'confirmed',
          total_cost: 2000,
          special_requirements: 'Cardiac monitoring required',
          attendant_required: true,
          meal_preferences: 'Vegetarian',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          patient: {
            name: 'Eva Martinez',
            uid: 'CLN1-PQR678',
            phone: '+91-9876543215'
          },
          daycare_type: 'dialysis',
          duration_hours: 6,
          booking_date: '2025-01-19',
          status: 'confirmed',
          total_cost: 4000,
          special_requirements: 'Regular dialysis session',
          attendant_required: false,
          meal_preferences: 'No restrictions',
          created_at: new Date().toISOString()
        }
      ];
      setDaycareBookings(demoDaycareBookings);

      // Fetch notifications
      const demoNotifications = [
        {
          id: '1',
          title: 'New Admission Request',
          message: 'Dr. Sarah Johnson has suggested admission for John Doe',
          type: 'info',
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Nurse Call Request',
          message: 'Dr. Michael Chen requests nurse assistance in Room 101',
          type: 'warning',
          is_read: false,
          created_at: new Date(Date.now() - 300000).toISOString()
        }
      ];
      setNotifications(demoNotifications);

    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllAdminData();
    }
  }, [user]);

  // If not authenticated, show login form
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-teal-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
              <p className="text-slate-600 text-sm mt-2">
                Secure access to medical management system
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoginLoading(true);
                try {
                  const { data, error } = await supabase.auth.signInWithPassword({
                    email: loginForm.email,
                    password: loginForm.password,
                  });
                  if (error) throw error;
                } catch (error: any) {
                  alert(error.message || 'Login failed. Please check your credentials.');
                } finally {
                  setLoginLoading(false);
                }
              }}
              className="space-y-4"
            >
              <Input
                label="Email Address"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@mediqueue.com"
                required
              />
              <Input
                label="Password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                required
              />
              <Button type="submit" loading={loginLoading} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Sign In to Admin Panel
              </Button>
              <div className="text-center text-sm text-slate-600 mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="font-medium mb-2">Demo Credentials:</p>
                <p>Email: admin@mediqueue.com</p>
                <p>Password: admin123</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || queueLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const handleQRScan = async (payload: QRPayload) => {
    try {
      setError('');
      // Find the visit by QR payload
      const { data: visits, error } = await supabase
        .from('visits')
        .select(`
          *,
          patient:patients(*),
          doctor:doctors(*)
        `)
        .eq('stn', payload.stn)
        .eq('visit_date', payload.visit_date);

      if (error) {
        console.error('QR scan error:', error);
        setError('Error scanning QR code. Please try again.');
        return;
      }

      const visit = visits?.find(v => {
        try {
          const qrData = JSON.parse(v.qr_payload);
          return qrData.uid === payload.uid;
        } catch {
          return false;
        }
      });

      if (!visit) {
        setError('Visit not found. Please check the QR code.');
        return;
      }

      // Check if visit is from today
      const today = new Date().toISOString().split('T')[0];
      if (visit.visit_date !== today) {
        setError('This QR code is not valid for today.');
        return;
      }

      // Update status to checked_in if currently waiting
      if (visit.status === 'waiting') {
        const { error: updateError } = await supabase
          .from('visits')
          .update({ 
            status: 'checked_in',
            checked_in_at: new Date().toISOString()
          })
          .eq('id', visit.id);

        if (updateError) {
          console.error('Error updating visit:', updateError);
          setError('Failed to check in patient. Please try again.');
          return;
        } else {
          refetch();
          setSuccess('Patient checked in successfully!');
        }
      }

      setSelectedVisit(visit);
      setShowVisitModal(true);
      setShowScanner(false);
    } catch (error) {
      console.error('Error handling QR scan:', error);
      setError('Error processing QR code. Please try again.');
    }
  };

  const processPayment = async (visitId: string, amount: number, method: string = 'cash') => {
    try {
      setError('');
      const visit = visits.find(v => v.id === visitId);
      if (!visit) {
        throw new Error('Visit not found');
      }

      // Create payment transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          visit_id: visitId,
          patient_id: visit.patient_id,
          amount: amount,
          payment_method: method,
          status: 'completed',
          processed_by: user?.id,
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update visit payment status
      const { error: visitError } = await supabase
        .from('visits')
        .update({ payment_status: 'paid' })
        .eq('id', visitId);

      if (visitError) throw visitError;

      setSuccess(`Payment of ₹${amount} processed successfully`);
      refetch();
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentMethod('cash');
    } catch (error: any) {
      console.error('Error processing payment:', error);
      setError(error.message || 'Failed to process payment');
    }
  };

  const updateVisitStatus = async (visitId: string, status: string) => {
    try {
      setError('');
      const updates: any = { status };
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      } else if (status === 'checked_in') {
        updates.checked_in_at = new Date().toISOString();
      } else if (status === 'in_service') {
        updates.checked_in_at = updates.checked_in_at || new Date().toISOString();
      }

      const { error } = await supabase
        .from('visits')
        .update(updates)
        .eq('id', visitId);

      if (error) throw error;

      setSuccess(`Visit status updated to ${status.replace('_', ' ')}`);
      refetch();
    } catch (error) {
      console.error('Error updating visit status:', error);
      setError('Failed to update status');
    }
  };

  const updatePaymentStatus = async (visitId: string, paymentStatus: string) => {
    try {
      setError('');
      const { error } = await supabase
        .from('visits')
        .update({ payment_status: paymentStatus })
        .eq('id', visitId);

      if (error) throw error;

      setSuccess(`Payment status updated to ${paymentStatus.replace('_', ' ')}`);
      refetch();
    } catch (error) {
      console.error('Error updating payment status:', error);
      setError('Failed to update payment status');
    }
  };

  const approveAdmissionRequest = async (requestId: string) => {
    try {
      setAdmissionRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'approved' } : req
      ));
      setSuccess('Admission request approved successfully!');
    } catch (error) {
      console.error('Error approving admission:', error);
      setError('Failed to approve admission request');
    }
  };

  const respondToNurseCall = async (callId: string, response: 'dispatched' | 'completed') => {
    try {
      setNurseCallRequests(prev => prev.map(call => 
        call.id === callId ? { ...call, status: response } : call
      ));
      setSuccess(`Nurse call ${response} successfully!`);
    } catch (error) {
      console.error('Error responding to nurse call:', error);
      setError('Failed to respond to nurse call');
    }
  };

  const processDepartmentReferral = async (referralId: string, action: 'approve' | 'schedule') => {
    try {
      setDepartmentReferrals(prev => prev.map(ref => 
        ref.id === referralId ? { ...ref, status: action === 'approve' ? 'approved' : 'scheduled' } : ref
      ));
      setSuccess(`Department referral ${action}d successfully!`);
    } catch (error) {
      console.error('Error processing referral:', error);
      setError('Failed to process department referral');
    }
  };

  // Filter visits based on search and filters
  const filteredVisits = visits.filter(visit => {
    const matchesSearch = !searchQuery || 
      visit.stn.toString().includes(searchQuery) ||
      visit.patient?.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.patient?.phone.includes(searchQuery);

    const matchesStatus = !statusFilter || visit.status === statusFilter;
    const matchesDepartment = !departmentFilter || visit.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const departments = Array.from(new Set(visits.map(v => v.department)));
  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map(dept => ({ value: dept, label: dept.charAt(0).toUpperCase() + dept.slice(1) }))
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'waiting', label: 'Waiting' },
    { value: 'checked_in', label: 'Checked In' },
    { value: 'in_service', label: 'In Service' },
    { value: 'completed', label: 'Completed' },
    { value: 'held', label: 'On Hold' },
    { value: 'expired', label: 'Expired' },
  ];

  const unreadNotifications = notifications.filter(n => !n.is_read).length;
  const urgentAdmissions = admissionRequests.filter(req => req.priority === 'urgent').length;
  const pendingNurseCalls = nurseCallRequests.filter(call => call.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="bg-teal-600 rounded-lg p-2 mr-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">MediQueue Admin</h1>
                <p className="text-sm text-slate-600">Medical Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <LanguageSwitcher />
              
              {/* Notifications */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotifications(true)}
                className="relative"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Button>

              {/* Auto Refresh Controls */}
              <div className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefreshEnabled}
                  onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="auto-refresh" className="text-slate-600">
                  Auto Refresh ({refreshInterval}s)
                </label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="text-xs border border-slate-300 rounded px-1 py-0.5 bg-white"
                >
                  <option value={10}>10s</option>
                  <option value={15}>15s</option>
                  <option value={30}>30s</option>
                  <option value={60}>60s</option>
                </select>
              </div>

              {/* Quick Actions */}
              <Button 
                onClick={() => setShowScanner(true)}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700"
              >
                <QrCode className="mr-2 h-4 w-4" />
                Scan QR
              </Button>
              
              <Button 
                onClick={() => setShowPatientLookup(true)}
                variant="outline"
                size="sm"
              >
                <UserSearch className="mr-2 h-4 w-4" />
                Patient Lookup
              </Button>

              <Button variant="outline" onClick={() => signOut()} size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <Button 
                onClick={() => setError('')} 
                variant="ghost"
                size="sm"
                className="ml-auto"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <h3 className="text-green-800 font-medium">Success</h3>
                <p className="text-green-700 text-sm mt-1">{success}</p>
              </div>
              <Button 
                onClick={() => setSuccess('')} 
                variant="ghost"
                size="sm"
                className="ml-auto"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Clock className="h-6 w-6 text-teal-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-teal-700">Now Serving</p>
                  <p className="text-2xl font-bold text-teal-900">{queueStatus.now_serving}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-700">Total Waiting</p>
                  <p className="text-2xl font-bold text-orange-900">{queueStatus.total_waiting}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-700">Completed Today</p>
                  <p className="text-2xl font-bold text-green-900">
                    {visits.filter(v => v.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700">Appointments</p>
                  <p className="text-2xl font-bold text-blue-900">{scheduledAppointments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bed className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-700">Day Care</p>
                  <p className="text-2xl font-bold text-purple-900">{daycareBookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-emerald-700">Today Revenue</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    ₹{analytics?.today.revenue.toFixed(0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Cards for Urgent Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {urgentAdmissions > 0 && (
            <Card className="border-l-4 border-red-500 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-red-900">Urgent Admissions</h4>
                    <p className="text-sm text-red-700">{urgentAdmissions} patients need immediate admission</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowAdmissionRequests(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {pendingNurseCalls > 0 && (
            <Card className="border-l-4 border-yellow-500 bg-yellow-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-yellow-900">Nurse Calls</h4>
                    <p className="text-sm text-yellow-700">{pendingNurseCalls} doctors need nurse assistance</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowNurseCallRequests(true)}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Respond
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {departmentReferrals.filter(ref => ref.status === 'pending').length > 0 && (
            <Card className="border-l-4 border-purple-500 bg-purple-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-purple-900">Department Referrals</h4>
                    <p className="text-sm text-purple-700">
                      {departmentReferrals.filter(ref => ref.status === 'pending').length} patients referred
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowDepartmentReferrals(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Process
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Management Modules */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Button
            onClick={() => setShowAdmission(true)}
            className="h-24 flex-col bg-teal-600 hover:bg-teal-700 shadow-lg"
          >
            <Bed className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Patient Admission</span>
          </Button>

          <Button
            onClick={() => setShowPharmacy(true)}
            className="h-24 flex-col bg-purple-600 hover:bg-purple-700 shadow-lg"
          >
            <Pill className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Pharmacy Module</span>
          </Button>

          <Button
            onClick={() => setShowRoomManagement(true)}
            className="h-24 flex-col bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            <Building2 className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Room Management</span>
          </Button>

          <Button
            onClick={() => setShowSettings(true)}
            className="h-24 flex-col bg-slate-600 hover:bg-slate-700 shadow-lg"
          >
            <Settings className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">System Settings</span>
          </Button>
        </div>

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Button
            onClick={() => setShowAdmissionRequests(true)}
            variant="outline"
            className="relative"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Admission Requests
            {urgentAdmissions > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {urgentAdmissions}
              </span>
            )}
          </Button>

          <Button
            onClick={() => setShowNurseCallRequests(true)}
            variant="outline"
            className="relative"
          >
            <Bell className="h-4 w-4 mr-2" />
            Nurse Calls
            {pendingNurseCalls > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingNurseCalls}
              </span>
            )}
          </Button>

          <Button
            onClick={() => setShowDepartmentReferrals(true)}
            variant="outline"
          >
            <Activity className="h-4 w-4 mr-2" />
            Referrals
          </Button>

          <Button
            onClick={() => setShowScheduledAppointments(true)}
            variant="outline"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Appointments
          </Button>

          <Button
            onClick={() => setShowDaycareBookings(true)}
            variant="outline"
          >
            <Heart className="h-4 w-4 mr-2" />
            Day Care
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by STN, UID, name, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="md:col-span-2"
              />
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="Filter by status"
              />
              <Select
                options={departmentOptions}
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                placeholder="Filter by department"
              />
            </div>
          </CardContent>
        </Card>

        {/* Queue Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Today's Queue Management</h2>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Token
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredVisits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-slate-900">#{visit.stn}</div>
                        <div className="text-sm text-slate-500 font-mono">{visit.patient?.uid}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {visit.patient?.name}
                              <button
                                onClick={() => {
                                  setSelectedPatientId(visit.patient_id);
                                  setShowPatientDetail(true);
                                }}
                                className="ml-2 text-teal-600 hover:text-teal-800 text-xs underline"
                              >
                                View Profile
                              </button>
                            </div>
                            <div className="text-sm text-slate-500">
                              Age: {visit.patient?.age} | {visit.patient?.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-900 capitalize font-medium">
                          {visit.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(visit.status)}`}>
                          {visit.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(visit.payment_status)}`}>
                          {visit.payment_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div>{formatTime(visit.created_at)}</div>
                        <div>{formatRelativeTime(visit.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedVisit(visit);
                              setShowVisitModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {visit.status === 'waiting' && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                await updateVisitStatus(visit.id, 'checked_in');
                              }}
                              className="bg-teal-600 hover:bg-teal-700"
                            >
                              Check In
                            </Button>
                          )}
                          
                          {visit.status === 'checked_in' && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                await updateVisitStatus(visit.id, 'in_service');
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Start Service
                            </Button>
                          )}
                          
                          {visit.status === 'in_service' && (
                            <Button
                              size="sm"
                              onClick={async () => {
                                await updateVisitStatus(visit.id, 'completed');
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Complete
                            </Button>
                          )}

                          {visit.payment_status === 'pay_at_clinic' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                setSelectedVisit(visit);
                                setPaymentAmount('500');
                                setShowPaymentModal(true);
                              }}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredVisits.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No visits found matching your criteria</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* All Modals */}
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleQRScan}
      />

      <PatientLookup
        isOpen={showPatientLookup}
        onClose={() => setShowPatientLookup(false)}
      />

      <PatientDetailModal
        isOpen={showPatientDetail}
        onClose={() => setShowPatientDetail(false)}
        patientId={selectedPatientId}
      />

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <PharmacyManagement
        isOpen={showPharmacy}
        onClose={() => setShowPharmacy(false)}
      />

      <AdmissionManagement
        isOpen={showAdmission}
        onClose={() => setShowAdmission(false)}
        patientId={selectedVisit?.patient_id}
        visitId={selectedVisit?.id}
      />

      <RoomManagement
        isOpen={showRoomManagement}
        onClose={() => setShowRoomManagement(false)}
      />

      {/* Admission Requests Modal */}
      <Modal
        isOpen={showAdmissionRequests}
        onClose={() => setShowAdmissionRequests(false)}
        title="Admission Requests"
        size="xl"
      >
        <div className="space-y-4">
          {admissionRequests.map((request) => (
            <Card key={request.id} className={`border-l-4 ${
              request.priority === 'urgent' ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'
            }`}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-slate-900">{request.patient.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {request.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      Recommended by: {request.doctor.name} ({request.doctor.specialization})
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <p className="text-sm"><strong>Reason:</strong> {request.reason}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="capitalize">{request.admission_type} admission</span>
                        <span className="capitalize">{request.ward_type} ward</span>
                        <span>{request.estimated_duration} days</span>
                        <span className="font-medium text-green-600">₹{request.estimated_cost}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => approveAdmissionRequest(request.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedVisit({ patient_id: request.patient.id } as Visit);
                        setShowAdmission(true);
                      }}
                    >
                      Process
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Nurse Call Requests Modal */}
      <Modal
        isOpen={showNurseCallRequests}
        onClose={() => setShowNurseCallRequests(false)}
        title="Nurse Call Requests"
        size="lg"
      >
        <div className="space-y-4">
          {nurseCallRequests.map((call) => (
            <Card key={call.id} className={`border-l-4 ${
              call.urgency === 'urgent' ? 'border-red-500 bg-red-50' :
              call.urgency === 'high' ? 'border-orange-500 bg-orange-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-slate-900">{call.doctor.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        call.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                        call.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {call.urgency.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      Room: {call.room_number} | Patient: {call.patient?.name}
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <p className="text-sm"><strong>Reason:</strong> {call.reason}</p>
                      {call.special_instructions && (
                        <p className="text-sm mt-1"><strong>Instructions:</strong> {call.special_instructions}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => respondToNurseCall(call.id, 'dispatched')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Dispatch Nurse
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => respondToNurseCall(call.id, 'completed')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark Complete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Department Referrals Modal */}
      <Modal
        isOpen={showDepartmentReferrals}
        onClose={() => setShowDepartmentReferrals(false)}
        title="Department Referrals"
        size="lg"
      >
        <div className="space-y-4">
          {departmentReferrals.map((referral) => (
            <Card key={referral.id} className="border-l-4 border-purple-500 bg-purple-50">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-slate-900">{referral.patient.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        referral.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                        referral.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {referral.urgency.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      From: {referral.from_doctor.name} ({referral.from_doctor.specialization}) → 
                      To: {referral.to_department}
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <p className="text-sm"><strong>Reason:</strong> {referral.reason}</p>
                      {referral.notes && (
                        <p className="text-sm mt-1"><strong>Notes:</strong> {referral.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => processDepartmentReferral(referral.id, 'approve')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => processDepartmentReferral(referral.id, 'schedule')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Scheduled Appointments Modal */}
      <Modal
        isOpen={showScheduledAppointments}
        onClose={() => setShowScheduledAppointments(false)}
        title="Scheduled Appointments"
        size="xl"
      >
        <div className="space-y-4">
          {scheduledAppointments.map((appointment) => (
            <Card key={appointment.id} className="border border-slate-200">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-slate-900">{appointment.patient.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {appointment.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {appointment.appointment_date} at {appointment.appointment_time} | 
                      {appointment.doctor.name} ({appointment.doctor.specialization})
                    </p>
                    <p className="text-sm text-slate-600">
                      Type: {appointment.appointment_type} | Patient ID: {appointment.patient.uid}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline">
                      Reschedule
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Confirm
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Day Care Bookings Modal */}
      <Modal
        isOpen={showDaycareBookings}
        onClose={() => setShowDaycareBookings(false)}
        title="Day Care Bookings"
        size="xl"
      >
        <div className="space-y-4">
          {daycareBookings.map((booking) => (
            <Card key={booking.id} className="border border-slate-200">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-slate-900">{booking.patient.name}</h4>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        {booking.daycare_type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      Date: {booking.booking_date} | Duration: {booking.duration_hours} hours | 
                      Cost: ₹{booking.total_cost}
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <p className="text-sm"><strong>Requirements:</strong> {booking.special_requirements}</p>
                      <p className="text-sm"><strong>Meals:</strong> {booking.meal_preferences}</p>
                      <p className="text-sm"><strong>Attendant:</strong> {booking.attendant_required ? 'Required' : 'Not required'}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      Manage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="System Notifications"
        size="lg"
      >
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`border-l-4 ${
              notification.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
              notification.type === 'error' ? 'border-red-500 bg-red-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{notification.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-slate-500 mt-2">{formatRelativeTime(notification.created_at)}</p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Visit Details Modal */}
      <Modal
        isOpen={showVisitModal}
        onClose={() => setShowVisitModal(false)}
        title="Patient Visit Details"
        size="lg"
      >
        {selectedVisit && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-teal-600" />
                  Patient Information
                </h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Patient ID:</span>
                    <span className="font-medium font-mono">{selectedVisit.patient?.uid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Name:</span>
                    <span className="font-medium">{selectedVisit.patient?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Age:</span>
                    <span className="font-medium">{selectedVisit.patient?.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Phone:</span>
                    <span className="font-medium">{selectedVisit.patient?.phone}</span>
                  </div>
                  {selectedVisit.patient?.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Email:</span>
                      <span className="font-medium">{selectedVisit.patient.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-teal-600" />
                  Visit Information
                </h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Token Number:</span>
                    <span className="font-bold text-lg text-teal-600">#{selectedVisit.stn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Department:</span>
                    <span className="font-medium capitalize">{selectedVisit.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedVisit.status)}`}>
                      {selectedVisit.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Payment:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(selectedVisit.payment_status)}`}>
                      {selectedVisit.payment_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Booked At:</span>
                    <span className="font-medium">{formatTime(selectedVisit.created_at)}</span>
                  </div>
                  {selectedVisit.checked_in_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Checked In:</span>
                      <span className="font-medium">{formatTime(selectedVisit.checked_in_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowVisitModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              
              {selectedVisit.status === 'waiting' && (
                <Button
                  onClick={async () => {
                    await updateVisitStatus(selectedVisit.id, 'checked_in');
                    setShowVisitModal(false);
                  }}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  Check In Patient
                </Button>
              )}
              
              {selectedVisit.status === 'checked_in' && (
                <Button
                  onClick={async () => {
                    await updateVisitStatus(selectedVisit.id, 'in_service');
                    setShowVisitModal(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Start Service
                </Button>
              )}
              
              {selectedVisit.status === 'in_service' && (
                <Button
                  onClick={async () => {
                    await updateVisitStatus(selectedVisit.id, 'completed');
                    setShowVisitModal(false);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Complete Visit
                </Button>
              )}
              
              {selectedVisit.payment_status === 'pay_at_clinic' && (
                <Button
                  onClick={async () => {
                    setPaymentAmount('500');
                    setShowPaymentModal(true);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Payment
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Processing Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentAmount('');
          setPaymentMethod('cash');
        }}
        title="Process Payment"
        size="md"
      >
        {selectedVisit && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Payment Details</h4>
              <p className="text-sm text-slate-600">
                Patient: {selectedVisit.patient?.name} - Token #{selectedVisit.stn}
              </p>
              <p className="text-sm text-slate-600 capitalize">
                Department: {selectedVisit.department}
              </p>
            </div>

            <Input
              label="Payment Amount (₹)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="0.01"
              required
            />

            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'cash', label: 'Cash Payment' },
                { value: 'card', label: 'Credit/Debit Card' },
                { value: 'upi', label: 'UPI Payment' },
                { value: 'online', label: 'Online Transfer' },
                { value: 'insurance', label: 'Insurance Claim' }
              ]}
              required
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount('');
                  setPaymentMethod('cash');
                  setError('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
                    setError('Please enter a valid amount');
                    return;
                  }
                  setError('');
                  await processPayment(selectedVisit.id, parseFloat(paymentAmount), paymentMethod);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};