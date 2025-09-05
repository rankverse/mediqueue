import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Bed, 
  Pill, 
  Calendar, 
  CreditCard, 
  FileText, 
  BarChart3,
  UserPlus,
  BedDouble,
  Package,
  Stethoscope,
  Shield,
  Bell,
  Database,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  Eye,
  Activity,
  CheckSquare,
  Building2,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { PharmacyManagement } from './PharmacyManagement';
import { AdmissionManagement } from './AdmissionManagement';
import { SettingsPanel } from './SettingsPanel';
import { supabase } from '../lib/supabase';

interface AdvancedAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedAdminPanel: React.FC<AdvancedAdminPanelProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'admissions' | 'pharmacy' | 'appointments' | 'rooms' | 'settings'>('overview');
  const [showPharmacy, setShowPharmacy] = useState(false);
  const [showAdmission, setShowAdmission] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [admissionRequests, setAdmissionRequests] = useState<any[]>([]);
  const [scheduledAppointments, setScheduledAppointments] = useState<any[]>([]);
  const [daycareBookings, setDaycareBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch admission requests
      const admissions = [
        {
          id: '1',
          patient_name: 'John Doe',
          patient_uid: 'CLN1-ABC123',
          doctor_name: 'Dr. Sarah Johnson',
          admission_type: 'planned',
          ward_type: 'private',
          status: 'pending',
          estimated_cost: 15000,
          priority: 'normal',
          reason: 'Requires observation for chest pain',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          patient_name: 'Jane Smith',
          patient_uid: 'CLN1-XYZ789',
          doctor_name: 'Dr. Michael Chen',
          admission_type: 'emergency',
          ward_type: 'icu',
          status: 'pending',
          estimated_cost: 25000,
          priority: 'urgent',
          reason: 'Acute myocardial infarction',
          created_at: new Date(Date.now() - 1800000).toISOString()
        }
      ];
      setAdmissionRequests(admissions);

      // Fetch scheduled appointments
      const appointments = [
        {
          id: '1',
          patient_name: 'Alice Johnson',
          patient_uid: 'CLN1-DEF456',
          doctor_name: 'Dr. Sarah Johnson',
          appointment_date: '2025-01-20',
          appointment_time: '10:00',
          department: 'general',
          appointment_type: 'consultation',
          status: 'confirmed',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          patient_name: 'Bob Wilson',
          patient_uid: 'CLN1-GHI789',
          doctor_name: 'Dr. Michael Chen',
          appointment_date: '2025-01-21',
          appointment_time: '14:30',
          department: 'cardiology',
          appointment_type: 'follow_up',
          status: 'confirmed',
          created_at: new Date().toISOString()
        }
      ];
      setScheduledAppointments(appointments);

      // Fetch daycare bookings
      const daycare = [
        {
          id: '1',
          patient_name: 'Carol Davis',
          patient_uid: 'CLN1-JKL012',
          daycare_type: 'observation',
          duration_hours: 8,
          booking_date: '2025-01-18',
          status: 'confirmed',
          total_cost: 2000,
          special_requirements: 'Cardiac monitoring required',
          attendant_required: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          patient_name: 'David Brown',
          patient_uid: 'CLN1-MNO345',
          daycare_type: 'dialysis',
          duration_hours: 6,
          booking_date: '2025-01-19',
          status: 'confirmed',
          total_cost: 4000,
          special_requirements: 'Regular dialysis session',
          attendant_required: false,
          created_at: new Date().toISOString()
        }
      ];
      setDaycareBookings(daycare);

      // Fetch rooms
      const roomsData = [
        {
          id: 'R101',
          room_number: '101',
          room_type: 'general',
          floor_number: 1,
          bed_count: 4,
          daily_rate: 1500,
          current_patient: null,
          status: 'available',
          last_cleaned: new Date().toISOString()
        },
        {
          id: 'R201',
          room_number: '201',
          room_type: 'private',
          floor_number: 2,
          bed_count: 1,
          daily_rate: 3000,
          current_patient: { name: 'John Doe', uid: 'CLN1-ABC123' },
          status: 'occupied',
          last_cleaned: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'ICU1',
          room_number: 'ICU-1',
          room_type: 'icu',
          floor_number: 4,
          bed_count: 1,
          daily_rate: 5000,
          current_patient: null,
          status: 'maintenance',
          last_cleaned: new Date().toISOString()
        }
      ];
      setRooms(roomsData);

      // System stats
      setSystemStats({
        total_patients: 150,
        active_admissions: 12,
        pending_appointments: 25,
        pharmacy_sales: 45000,
        bed_occupancy: 75,
        daycare_bookings: 8,
        pending_admissions: admissions.filter(a => a.status === 'pending').length
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 text-teal-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{systemStats.total_patients || 0}</div>
            <div className="text-sm text-gray-600">Total Patients</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Bed className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{systemStats.active_admissions || 0}</div>
            <div className="text-sm text-gray-600">Active Admissions</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{systemStats.pending_appointments || 0}</div>
            <div className="text-sm text-gray-600">Appointments</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">₹{systemStats.pharmacy_sales || 0}</div>
            <div className="text-sm text-gray-600">Pharmacy Sales</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          onClick={() => setShowAdmission(true)}
          className="h-20 flex-col bg-teal-600 hover:bg-teal-700"
        >
          <Bed className="h-6 w-6 mb-2" />
          Admit Patient
        </Button>

        <Button
          onClick={() => setShowPharmacy(true)}
          className="h-20 flex-col bg-purple-600 hover:bg-purple-700"
        >
          <Pill className="h-6 w-6 mb-2" />
          Pharmacy
        </Button>

        <Button
          onClick={() => setActiveSection('appointments')}
          className="h-20 flex-col bg-blue-600 hover:bg-blue-700"
        >
          <Calendar className="h-6 w-6 mb-2" />
          Appointments
        </Button>

        <Button
          onClick={() => setShowSettings(true)}
          className="h-20 flex-col bg-gray-600 hover:bg-gray-700"
        >
          <Settings className="h-6 w-6 mb-2" />
          Settings
        </Button>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Activities</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckSquare className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Patient admitted to Room 201</p>
                <p className="text-sm text-gray-600">John Doe - 2 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Pill className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Prescription processed</p>
                <p className="text-sm text-gray-600">Jane Smith - 5 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Appointment scheduled</p>
                <p className="text-sm text-gray-600">Bob Wilson - 10 minutes ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-red-500">
          <CardHeader>
            <h4 className="font-semibold text-red-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Urgent Admission Requests ({systemStats.pending_admissions || 0})
            </h4>
          </CardHeader>
          <CardContent>
            {admissionRequests.filter(req => req.priority === 'urgent').map(req => (
              <div key={req.id} className="flex justify-between items-center p-2 bg-red-50 rounded mb-2">
                <div>
                  <p className="font-medium text-red-900">{req.patient_name}</p>
                  <p className="text-sm text-red-700">{req.reason}</p>
                </div>
                <Button size="sm" onClick={() => setShowAdmission(true)}>
                  Review
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500">
          <CardHeader>
            <h4 className="font-semibold text-blue-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Today's Appointments ({scheduledAppointments.length})
            </h4>
          </CardHeader>
          <CardContent>
            {scheduledAppointments.slice(0, 3).map(apt => (
              <div key={apt.id} className="flex justify-between items-center p-2 bg-blue-50 rounded mb-2">
                <div>
                  <p className="font-medium text-blue-900">{apt.patient_name}</p>
                  <p className="text-sm text-blue-700">{apt.appointment_time} - {apt.doctor_name}</p>
                </div>
                <Button size="sm" variant="outline">
                  Manage
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAdmissions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Admission Management</h3>
        <Button onClick={() => setShowAdmission(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Admission
        </Button>
      </div>

      <div className="grid gap-4">
        {admissionRequests.map((admission) => (
          <Card key={admission.id} className={`border-l-4 ${
            admission.priority === 'urgent' ? 'border-red-500' : 'border-blue-500'
          }`}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{admission.patient_name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      admission.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      admission.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {admission.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      admission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      admission.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {admission.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Recommended by: {admission.doctor_name}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Patient ID: {admission.patient_uid}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm"><strong>Reason:</strong> {admission.reason}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span className="capitalize">{admission.admission_type} admission</span>
                      <span className="capitalize">{admission.ward_type} ward</span>
                      <span className="font-medium text-green-600">₹{admission.estimated_cost}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => setShowAdmission(true)}>
                    Process
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scheduled Appointments</h3>
        <div className="text-sm text-gray-600">
          Today: {scheduledAppointments.length} | This Week: {scheduledAppointments.length + 15}
        </div>
      </div>
      
      {scheduledAppointments.map((appointment) => (
        <Card key={appointment.id} className="border border-gray-200">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold text-gray-900">{appointment.patient_name}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {appointment.appointment_date} at {appointment.appointment_time}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  {appointment.doctor_name} - {appointment.department}
                </p>
                <p className="text-sm text-gray-600">
                  Type: {appointment.appointment_type} | Patient ID: {appointment.patient_uid}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  Reschedule
                </Button>
                <Button size="sm">
                  Confirm
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-l-4 border-blue-500">
        <CardHeader>
          <h4 className="font-semibold text-blue-900">Day Care Bookings</h4>
        </CardHeader>
        <CardContent>
          {daycareBookings.map((booking) => (
            <div key={booking.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-1">
                  <p className="font-medium">{booking.patient_name}</p>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {booking.daycare_type.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {booking.booking_date} | {booking.duration_hours} hours | ₹{booking.total_cost}
                </p>
                <p className="text-sm text-gray-600">
                  Patient ID: {booking.patient_uid}
                </p>
                {booking.special_requirements && (
                  <p className="text-xs text-gray-500 mt-1">
                    Special: {booking.special_requirements}
                  </p>
                )}
              </div>
              <Button size="sm">
                Manage
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderRooms = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Room Management</h3>
        <div className="text-sm text-gray-600">
          Occupancy: {systemStats.bed_occupancy}% | Available: {rooms.filter(r => r.status === 'available').length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <Card key={room.id} className={`border-2 ${
            room.status === 'available' ? 'border-green-200 bg-green-50' :
            room.status === 'occupied' ? 'border-red-200 bg-red-50' :
            'border-yellow-200 bg-yellow-50'
          }`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Room {room.room_number}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Floor {room.floor_number} | {room.bed_count} bed{room.bed_count > 1 ? 's' : ''}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  room.status === 'available' ? 'bg-green-100 text-green-800' :
                  room.status === 'occupied' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {room.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="capitalize font-medium">{room.room_type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate:</span>
                  <span className="font-medium">₹{room.daily_rate}/day</span>
                </div>
                {room.current_patient && (
                  <div className="bg-white rounded p-2 border">
                    <p className="font-medium text-gray-900">Current Patient:</p>
                    <p className="text-sm">{room.current_patient.name}</p>
                    <p className="text-xs text-gray-500">{room.current_patient.uid}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Last Cleaned:</span>
                  <span className="text-xs">{formatDate(room.last_cleaned)}</span>
                </div>
              </div>

              <div className="mt-3 flex space-x-2">
                {room.status === 'available' && (
                  <Button size="sm" className="flex-1">
                    Assign
                  </Button>
                )}
                {room.status === 'occupied' && (
                  <Button size="sm" variant="outline" className="flex-1">
                    Discharge
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Advanced Admin Panel" size="xl">
        <div className="space-y-6">
          {/* Section Navigation */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'admissions', label: 'Admissions', icon: Bed },
              { key: 'pharmacy', label: 'Pharmacy', icon: Pill },
              { key: 'appointments', label: 'Appointments', icon: Calendar },
              { key: 'rooms', label: 'Rooms', icon: Building2 },
              { key: 'settings', label: 'Settings', icon: Settings }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={activeSection === key ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveSection(key as any)}
                className="flex-col h-16"
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>

          {/* Section Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading...</p>
              </div>
            ) : (
              <>
                {activeSection === 'overview' && renderOverview()}
                {activeSection === 'admissions' && renderAdmissions()}
                {activeSection === 'appointments' && renderAppointments()}
                {activeSection === 'rooms' && renderRooms()}
                {activeSection === 'pharmacy' && (
                  <div className="text-center py-8">
                    <Pill className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Pharmacy Management</h3>
                    <p className="text-gray-600 mb-6">Manage prescriptions, inventory, and billing</p>
                    <Button onClick={() => setShowPharmacy(true)} className="bg-purple-600 hover:bg-purple-700">
                      <Pill className="h-5 w-5 mr-2" />
                      Open Pharmacy Module
                    </Button>
                  </div>
                )}
                {activeSection === 'settings' && (
                  <div className="text-center py-8">
                    <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">System Settings</h3>
                    <p className="text-gray-600 mb-6">Configure departments, doctors, and system preferences</p>
                    <Button onClick={() => setShowSettings(true)} className="bg-gray-600 hover:bg-gray-700">
                      <Settings className="h-5 w-5 mr-2" />
                      Open Settings Panel
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Pharmacy Management Modal */}
      <PharmacyManagement
        isOpen={showPharmacy}
        onClose={() => setShowPharmacy(false)}
      />

      {/* Admission Management Modal */}
      <AdmissionManagement
        isOpen={showAdmission}
        onClose={() => setShowAdmission(false)}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};