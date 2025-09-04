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
  Activity
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { PharmacyManagement } from './PharmacyManagement';
import { AdmissionManagement } from './AdmissionManagement';
import { supabase } from '../lib/supabase';

interface AdvancedAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedAdminPanel: React.FC<AdvancedAdminPanelProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'admissions' | 'pharmacy' | 'appointments' | 'settings'>('overview');
  const [showPharmacy, setShowPharmacy] = useState(false);
  const [showAdmission, setShowAdmission] = useState(false);
  const [admissionRequests, setAdmissionRequests] = useState<any[]>([]);
  const [scheduledAppointments, setScheduledAppointments] = useState<any[]>([]);
  const [daycareBookings, setDaycareBookings] = useState<any[]>([]);
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
          doctor_name: 'Dr. Smith',
          admission_type: 'planned',
          ward_type: 'private',
          status: 'pending',
          estimated_cost: 15000,
          created_at: new Date().toISOString()
        }
      ];
      setAdmissionRequests(admissions);

      // Fetch scheduled appointments
      const appointments = [
        {
          id: '1',
          patient_name: 'Jane Smith',
          doctor_name: 'Dr. Johnson',
          appointment_date: '2025-01-20',
          appointment_time: '10:00',
          department: 'cardiology',
          status: 'confirmed'
        }
      ];
      setScheduledAppointments(appointments);

      // Fetch daycare bookings
      const daycare = [
        {
          id: '1',
          patient_name: 'Bob Wilson',
          daycare_type: 'observation',
          duration: 8,
          date: '2025-01-18',
          status: 'confirmed',
          cost: 2000
        }
      ];
      setDaycareBookings(daycare);

      // System stats
      setSystemStats({
        total_patients: 150,
        active_admissions: 12,
        pending_appointments: 25,
        pharmacy_sales: 45000,
        bed_occupancy: 75
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <Pill className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">₹{systemStats.pharmacy_sales || 0}</div>
            <div className="text-sm text-gray-600">Pharmacy Sales</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Activity className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{systemStats.bed_occupancy || 0}%</div>
            <div className="text-sm text-gray-600">Bed Occupancy</div>
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
          onClick={() => setActiveSection('settings')}
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

      {admissionRequests.map((admission) => (
        <Card key={admission.id} className="border border-gray-200">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900">{admission.patient_name}</h4>
                <p className="text-sm text-gray-600">
                  Recommended by: {admission.doctor_name}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <span className="capitalize">{admission.admission_type} admission</span>
                  <span className="capitalize">{admission.ward_type} ward</span>
                  <span>₹{admission.estimated_cost}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm">
                  Process
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Scheduled Appointments</h3>
      
      {scheduledAppointments.map((appointment) => (
        <Card key={appointment.id} className="border border-gray-200">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900">{appointment.patient_name}</h4>
                <p className="text-sm text-gray-600">
                  {appointment.appointment_date} at {appointment.appointment_time}
                </p>
                <p className="text-sm text-gray-600">
                  Dr. {appointment.doctor_name} - {appointment.department}
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
              <div>
                <p className="font-medium">{booking.patient_name}</p>
                <p className="text-sm text-gray-600">
                  {booking.daycare_type} - {booking.duration} hours - ₹{booking.cost}
                </p>
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Advanced Admin Panel" size="xl">
        <div className="space-y-6">
          {/* Section Navigation */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'admissions', label: 'Admissions', icon: Bed },
              { key: 'pharmacy', label: 'Pharmacy', icon: Pill },
              { key: 'appointments', label: 'Appointments', icon: Calendar },
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
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">System Settings</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2">Appointment Settings</h4>
                          <div className="space-y-2">
                            <Input label="Max appointments per day" type="number" defaultValue="100" />
                            <Input label="Slot duration (minutes)" type="number" defaultValue="15" />
                            <Input label="Advance booking limit (days)" type="number" defaultValue="30" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-4">
                          <h4 className="font-medium mb-2">Admission Settings</h4>
                          <div className="space-y-2">
                            <Input label="Minimum advance payment (%)" type="number" defaultValue="50" />
                            <Input label="Maximum admission duration (days)" type="number" defaultValue="30" />
                            <Select
                              label="Default ward type"
                              options={[
                                { value: 'general', label: 'General Ward' },
                                { value: 'private', label: 'Private Room' }
                              ]}
                              defaultValue="general"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">Pharmacy Settings</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <Input label="Default tax rate (%)" type="number" defaultValue="5" />
                          <Input label="Maximum discount (%)" type="number" defaultValue="20" />
                          <Input label="Low stock alert threshold" type="number" defaultValue="10" />
                        </div>
                      </CardContent>
                    </Card>
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
    </>
  );
};