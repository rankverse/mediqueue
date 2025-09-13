import React, { useState, useEffect } from 'react';
import { Settings, Save, Plus, Trash2, Edit, AlertCircle, Building2, Users, Calendar, DollarSign, Clock, Pill, Bed } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { supabase } from '../lib/supabase';
import { ClinicSettings, Department, Doctor } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'departments' | 'doctors' | 'payment' | 'daycare' | 'pharmacy' | 'rooms'>('general');
  const [settings, setSettings] = useState<ClinicSettings[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Initialize with comprehensive default settings
      const defaultSettings = [
        // General Settings
        { setting_key: 'clinic_name', setting_value: 'MediQueue Medical Center', setting_type: 'general', description: 'Name of the medical facility' },
        { setting_key: 'maintenance_mode', setting_value: false, setting_type: 'general', description: 'Enable maintenance mode to prevent new bookings' },
        { setting_key: 'maintenance_message', setting_value: 'System is under maintenance. Please try again later.', setting_type: 'general', description: 'Message to show when maintenance mode is enabled' },
        { setting_key: 'clinic_hours_start', setting_value: '08:00', setting_type: 'general', description: 'Clinic opening time' },
        { setting_key: 'clinic_hours_end', setting_value: '20:00', setting_type: 'general', description: 'Clinic closing time' },
        { setting_key: 'auto_refresh_interval', setting_value: 15, setting_type: 'general', description: 'Auto refresh interval in seconds for admin dashboard' },
        { setting_key: 'max_tokens_per_day', setting_value: 100, setting_type: 'general', description: 'Maximum walk-in tokens per day per department' },
        { setting_key: 'average_consultation_time', setting_value: 15, setting_type: 'general', description: 'Average consultation time in minutes' },
        
        // Appointment Settings
        { setting_key: 'appointment_slot_duration', setting_value: 30, setting_type: 'general', description: 'Appointment slot duration in minutes' },
        { setting_key: 'max_advance_booking_days', setting_value: 30, setting_type: 'general', description: 'Maximum days in advance for appointment booking' },
        { setting_key: 'appointment_reminder_hours', setting_value: 24, setting_type: 'general', description: 'Hours before appointment to send reminder' },
        { setting_key: 'allow_same_day_appointments', setting_value: true, setting_type: 'general', description: 'Allow appointments for the same day' },
        
        // Day Care Settings
        { setting_key: 'daycare_observation_rate', setting_value: 2000, setting_type: 'daycare', description: 'Day care observation rate per day' },
        { setting_key: 'daycare_recovery_rate', setting_value: 3000, setting_type: 'daycare', description: 'Day care recovery rate per day' },
        { setting_key: 'daycare_dialysis_rate', setting_value: 4000, setting_type: 'daycare', description: 'Day care dialysis rate per day' },
        { setting_key: 'daycare_chemotherapy_rate', setting_value: 5000, setting_type: 'daycare', description: 'Day care chemotherapy rate per day' },
        { setting_key: 'daycare_physiotherapy_rate', setting_value: 1500, setting_type: 'daycare', description: 'Day care physiotherapy rate per day' },
        { setting_key: 'attendant_fee_per_day', setting_value: 500, setting_type: 'daycare', description: 'Attendant service fee per day' },
        { setting_key: 'daycare_advance_payment_percent', setting_value: 50, setting_type: 'daycare', description: 'Minimum advance payment percentage for day care' },
        
        // Pharmacy Settings
        { setting_key: 'pharmacy_tax_rate', setting_value: 5, setting_type: 'pharmacy', description: 'Pharmacy tax rate percentage' },
        { setting_key: 'max_discount_percentage', setting_value: 20, setting_type: 'pharmacy', description: 'Maximum discount percentage allowed' },
        { setting_key: 'prescription_validity_days', setting_value: 30, setting_type: 'pharmacy', description: 'Prescription validity in days' },
        { setting_key: 'low_stock_alert_threshold', setting_value: 10, setting_type: 'pharmacy', description: 'Low stock alert threshold' },
        { setting_key: 'medicine_expiry_alert_days', setting_value: 30, setting_type: 'pharmacy', description: 'Days before expiry to show alert' },
        
        // Room Settings
        { setting_key: 'room_cleaning_interval_hours', setting_value: 24, setting_type: 'rooms', description: 'Room cleaning interval in hours' },
        { setting_key: 'room_cleaning_fee', setting_value: 200, setting_type: 'rooms', description: 'Room cleaning service fee' },
        { setting_key: 'general_ward_rate', setting_value: 1500, setting_type: 'rooms', description: 'General ward daily rate' },
        { setting_key: 'private_room_rate', setting_value: 3000, setting_type: 'rooms', description: 'Private room daily rate' },
        { setting_key: 'semi_private_room_rate', setting_value: 2000, setting_type: 'rooms', description: 'Semi-private room daily rate' },
        { setting_key: 'icu_room_rate', setting_value: 5000, setting_type: 'rooms', description: 'ICU room daily rate' },
        
        // Payment Settings
        { setting_key: 'enable_online_payments', setting_value: true, setting_type: 'payment', description: 'Enable online payment processing' },
        { setting_key: 'stripe_publishable_key', setting_value: 'pk_test_51234567890abcdef', setting_type: 'payment', description: 'Stripe publishable key for payments' },
        { setting_key: 'stripe_secret_key', setting_value: 'sk_test_51234567890abcdef', setting_type: 'payment', description: 'Stripe secret key for payments' },
        { setting_key: 'admission_advance_payment_percent', setting_value: 50, setting_type: 'payment', description: 'Minimum advance payment percentage for admissions' },
        { setting_key: 'online_payment_discount', setting_value: 5, setting_type: 'payment', description: 'Discount percentage for online payments' },
        
        // Emergency Settings
        { setting_key: 'emergency_consultation_fee', setting_value: 1000, setting_type: 'general', description: 'Emergency consultation fee' },
        { setting_key: 'emergency_priority_multiplier', setting_value: 2, setting_type: 'general', description: 'Priority multiplier for emergency cases' },
        
        // Notification Settings
        { setting_key: 'sms_notifications_enabled', setting_value: true, setting_type: 'general', description: 'Enable SMS notifications' },
        { setting_key: 'email_notifications_enabled', setting_value: true, setting_type: 'general', description: 'Enable email notifications' },
        { setting_key: 'queue_position_alert_threshold', setting_value: 3, setting_type: 'general', description: 'Alert when patient is within this many positions' }
      ];

      setSettings(defaultSettings);

      // Initialize default departments
      const defaultDepartments = [
        {
          id: '1',
          name: 'general',
          display_name: 'General Medicine',
          description: 'General medical consultation and treatment',
          consultation_fee: 500,
          average_consultation_time: 15,
          color_code: '#0d9488',
          is_active: true,
          created_at: '',
          updated_at: ''
        },
        {
          id: '2',
          name: 'cardiology',
          display_name: 'Cardiology',
          description: 'Heart and cardiovascular system treatment',
          consultation_fee: 800,
          average_consultation_time: 20,
          color_code: '#dc2626',
          is_active: true,
          created_at: '',
          updated_at: ''
        },
        {
          id: '3',
          name: 'orthopedics',
          display_name: 'Orthopedics',
          description: 'Bone, joint, and muscle treatment',
          consultation_fee: 700,
          average_consultation_time: 18,
          color_code: '#7c3aed',
          is_active: true,
          created_at: '',
          updated_at: ''
        },
        {
          id: '4',
          name: 'pediatrics',
          display_name: 'Pediatrics',
          description: 'Child healthcare and treatment',
          consultation_fee: 600,
          average_consultation_time: 20,
          color_code: '#ea580c',
          is_active: true,
          created_at: '',
          updated_at: ''
        },
        {
          id: '5',
          name: 'dermatology',
          display_name: 'Dermatology',
          description: 'Skin and hair treatment',
          consultation_fee: 650,
          average_consultation_time: 15,
          color_code: '#8b5cf6',
          is_active: true,
          created_at: '',
          updated_at: ''
        },
        {
          id: '6',
          name: 'neurology',
          display_name: 'Neurology',
          description: 'Brain and nervous system treatment',
          consultation_fee: 900,
          average_consultation_time: 25,
          color_code: '#06b6d4',
          is_active: true,
          created_at: '',
          updated_at: ''
        }
      ];

      setDepartments(defaultDepartments);

      // Initialize default doctors
      const defaultDoctors = [
        {
          id: '1',
          name: 'Dr. Sarah Johnson',
          specialization: 'general',
          qualification: 'MBBS, MD',
          experience_years: 10,
          consultation_fee: 500,
          available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          available_hours: { start: '09:00', end: '17:00' },
          max_patients_per_day: 50,
          status: 'active',
          created_at: '',
          updated_at: ''
        },
        {
          id: '2',
          name: 'Dr. Michael Chen',
          specialization: 'cardiology',
          qualification: 'MBBS, MD, DM Cardiology',
          experience_years: 15,
          consultation_fee: 800,
          available_days: ['monday', 'wednesday', 'friday'],
          available_hours: { start: '10:00', end: '16:00' },
          max_patients_per_day: 30,
          status: 'active',
          created_at: '',
          updated_at: ''
        },
        {
          id: '3',
          name: 'Dr. Emily Rodriguez',
          specialization: 'orthopedics',
          qualification: 'MBBS, MS Orthopedics',
          experience_years: 12,
          consultation_fee: 700,
          available_days: ['tuesday', 'thursday', 'saturday'],
          available_hours: { start: '08:00', end: '16:00' },
          max_patients_per_day: 40,
          status: 'active',
          created_at: '',
          updated_at: ''
        },
        {
          id: '4',
          name: 'Dr. Priya Sharma',
          specialization: 'pediatrics',
          qualification: 'MBBS, MD Pediatrics',
          experience_years: 8,
          consultation_fee: 600,
          available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          available_hours: { start: '09:00', end: '17:00' },
          max_patients_per_day: 45,
          status: 'active',
          created_at: '',
          updated_at: ''
        },
        {
          id: '5',
          name: 'Dr. Rajesh Kumar',
          specialization: 'dermatology',
          qualification: 'MBBS, MD Dermatology',
          experience_years: 9,
          consultation_fee: 650,
          available_days: ['monday', 'wednesday', 'friday', 'saturday'],
          available_hours: { start: '10:00', end: '18:00' },
          max_patients_per_day: 35,
          status: 'active',
          created_at: '',
          updated_at: ''
        },
        {
          id: '6',
          name: 'Dr. Anita Verma',
          specialization: 'neurology',
          qualification: 'MBBS, MD, DM Neurology',
          experience_years: 18,
          consultation_fee: 900,
          available_days: ['tuesday', 'thursday', 'saturday'],
          available_hours: { start: '09:00', end: '15:00' },
          max_patients_per_day: 25,
          status: 'active',
          created_at: '',
          updated_at: ''
        }
      ];

      setDoctors(defaultDoctors);

    } catch (error: any) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSaving(true);
    setError('');
    try {
      // Update local state
      setSettings(prev => prev.map(s => 
        s.setting_key === key 
          ? { ...s, setting_value: value }
          : s
      ));
      
      // Show success message
      setTimeout(() => {
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successDiv.textContent = 'Setting updated successfully!';
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
      }, 100);
      
    } catch (error: any) {
      console.error('Error updating setting:', error);
      setError(error.message || 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const saveDepartment = async (department: Partial<Department>) => {
    setSaving(true);
    setError('');
    try {
      if (!department.name || !department.display_name) {
        throw new Error('Name and display name are required');
      }

      const departmentData = {
        ...department,
        id: department.id || `dept-${Date.now()}`,
        name: department.name.toLowerCase().replace(/\s+/g, '_'),
        consultation_fee: Number(department.consultation_fee) || 0,
        average_consultation_time: Number(department.average_consultation_time) || 15,
        color_code: department.color_code || '#0d9488',
        is_active: department.is_active !== false,
        created_at: department.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (department.id) {
        setDepartments(prev => prev.map(d => d.id === departmentData.id ? departmentData as Department : d));
      } else {
        setDepartments(prev => [departmentData as Department, ...prev]);
      }
      
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error('Error saving department:', error);
      setError(error.message || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const saveDoctor = async (doctor: Partial<Doctor>) => {
    setSaving(true);
    setError('');
    try {
      if (!doctor.name || !doctor.specialization) {
        throw new Error('Name and specialization are required');
      }

      const doctorData = {
        ...doctor,
        id: doctor.id || `doc-${Date.now()}`,
        experience_years: Number(doctor.experience_years) || 0,
        consultation_fee: Number(doctor.consultation_fee) || 0,
        max_patients_per_day: Number(doctor.max_patients_per_day) || 50,
        available_days: doctor.available_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        available_hours: doctor.available_hours || { start: '09:00', end: '17:00' },
        status: doctor.status || 'active',
        created_at: doctor.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (doctor.id) {
        setDoctors(prev => prev.map(d => d.id === doctorData.id ? doctorData as Doctor : d));
      } else {
        setDoctors(prev => [doctorData as Doctor, ...prev]);
      }
      
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error('Error saving doctor:', error);
      setError(error.message || 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (table: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setSaving(true);
    setError('');
    try {
      if (table === 'departments') {
        setDepartments(prev => prev.filter(d => d.id !== id));
      } else if (table === 'doctors') {
        setDoctors(prev => prev.filter(d => d.id !== id));
      }
    } catch (error: any) {
      console.error('Error deleting item:', error);
      setError(error.message || 'Failed to delete item');
    } finally {
      setSaving(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      {settings.filter(s => s.setting_type === 'general').map((setting) => (
        <div key={setting.setting_key} className="flex items-center justify-between p-4 border rounded-lg bg-white">
          <div className="flex-1">
            <h4 className="font-medium text-slate-900">
              {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h4>
            <p className="text-sm text-slate-600">{setting.description}</p>
          </div>
          <div className="w-64 ml-4">
            {setting.setting_key === 'maintenance_mode' || 
             setting.setting_key === 'enable_online_payments' ||
             setting.setting_key === 'allow_same_day_appointments' ||
             setting.setting_key === 'sms_notifications_enabled' ||
             setting.setting_key === 'email_notifications_enabled' ? (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={setting.setting_value}
                  onChange={(e) => updateSetting(setting.setting_key, e.target.checked)}
                  disabled={saving}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700">
                  {setting.setting_value ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ) : setting.setting_key.includes('time') || setting.setting_key.includes('hours') ? (
              <Input
                type="time"
                value={setting.setting_value}
                onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
                disabled={saving}
              />
            ) : setting.setting_key.includes('max_') || 
                setting.setting_key.includes('average_') || 
                setting.setting_key.includes('interval') ||
                setting.setting_key.includes('threshold') ||
                setting.setting_key.includes('multiplier') ? (
              <Input
                type="number"
                value={setting.setting_value}
                onChange={(e) => updateSetting(setting.setting_key, parseInt(e.target.value) || 0)}
                disabled={saving}
                min="0"
              />
            ) : setting.setting_key === 'maintenance_message' ? (
              <textarea
                value={setting.setting_value}
                onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={2}
              />
            ) : (
              <Input
                value={setting.setting_value}
                onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
                disabled={saving}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDepartments = () => (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Departments ({departments.length})</h3>
        <Button
          onClick={() => {
            setEditingItem({
              name: '',
              display_name: '',
              description: '',
              consultation_fee: 500,
              average_consultation_time: 15,
              color_code: '#0d9488',
              is_active: true
            });
            setShowEditModal(true);
          }}
          disabled={saving}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      <div className="grid gap-4">
        {departments.map((dept) => (
          <Card key={dept.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: dept.color_code }}
                  ></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{dept.display_name}</h4>
                    <p className="text-sm text-slate-600">{dept.description || 'No description'}</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-500 mt-1">
                      <span>Fee: ₹{dept.consultation_fee}</span>
                      <span>Time: {dept.average_consultation_time}min</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        dept.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {dept.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingItem(dept);
                      setShowEditModal(true);
                    }}
                    disabled={saving}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteItem('departments', dept.id)}
                    disabled={saving}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDoctors = () => (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Doctors ({doctors.length})</h3>
        <Button
          onClick={() => {
            setEditingItem({
              name: '',
              specialization: '',
              qualification: '',
              experience_years: 0,
              consultation_fee: 500,
              available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
              available_hours: { start: '09:00', end: '17:00' },
              max_patients_per_day: 50,
              status: 'active'
            });
            setShowEditModal(true);
          }}
          disabled={saving}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      <div className="grid gap-4">
        {doctors.map((doctor) => (
          <Card key={doctor.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-slate-900">{doctor.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      doctor.status === 'active' ? 'bg-green-100 text-green-800' :
                      doctor.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {doctor.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">
                    {departments.find(d => d.name === doctor.specialization)?.display_name || doctor.specialization} • {doctor.qualification || 'No qualification listed'}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <span>{doctor.experience_years} years exp</span>
                    <span>₹{doctor.consultation_fee}</span>
                    <span>Max: {doctor.max_patients_per_day}/day</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {doctor.available_hours.start} - {doctor.available_hours.end} • {doctor.available_days.length} days/week
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingItem(doctor);
                      setShowEditModal(true);
                    }}
                    disabled={saving}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteItem('doctors', doctor.id)}
                    disabled={saving}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderEditModal = () => {
    if (!editingItem) return null;

    const isDepartment = 'display_name' in editingItem;
    const isDoctor = 'specialization' in editingItem;

    return (
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
          setError('');
        }}
        title={`${editingItem.id ? 'Edit' : 'Add'} ${isDepartment ? 'Department' : 'Doctor'}`}
        size="lg"
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
          
          {isDepartment && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Name (Internal) *"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  placeholder="e.g., general_medicine"
                  required
                />
                <Input
                  label="Display Name *"
                  value={editingItem.display_name}
                  onChange={(e) => setEditingItem({...editingItem, display_name: e.target.value})}
                  placeholder="e.g., General Medicine"
                  required
                />
              </div>
              <Input
                label="Description"
                value={editingItem.description || ''}
                onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                placeholder="Brief description of the department"
              />
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Consultation Fee (₹) *"
                  type="number"
                  value={editingItem.consultation_fee}
                  onChange={(e) => setEditingItem({...editingItem, consultation_fee: parseFloat(e.target.value) || 0})}
                  min="0"
                  required
                />
                <Input
                  label="Avg Time (minutes) *"
                  type="number"
                  value={editingItem.average_consultation_time}
                  onChange={(e) => setEditingItem({...editingItem, average_consultation_time: parseInt(e.target.value) || 15})}
                  min="1"
                  required
                />
                <Input
                  label="Color Code"
                  type="color"
                  value={editingItem.color_code}
                  onChange={(e) => setEditingItem({...editingItem, color_code: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingItem.is_active}
                  onChange={(e) => setEditingItem({...editingItem, is_active: e.target.checked})}
                  className="rounded border-slate-300"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                  Active Department
                </label>
              </div>
            </>
          )}

          {isDoctor && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  placeholder="Dr. John Doe"
                  required
                />
                <Select
                  label="Specialization *"
                  value={editingItem.specialization}
                  onChange={(e) => setEditingItem({...editingItem, specialization: e.target.value})}
                  options={[
                    { value: '', label: 'Select Specialization' },
                    ...departments.map(dept => ({ value: dept.name, label: dept.display_name }))
                  ]}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Qualification"
                  value={editingItem.qualification || ''}
                  onChange={(e) => setEditingItem({...editingItem, qualification: e.target.value})}
                  placeholder="MBBS, MD"
                />
                <Input
                  label="Experience (years)"
                  type="number"
                  value={editingItem.experience_years}
                  onChange={(e) => setEditingItem({...editingItem, experience_years: parseInt(e.target.value) || 0})}
                  min="0"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Consultation Fee (₹)"
                  type="number"
                  value={editingItem.consultation_fee}
                  onChange={(e) => setEditingItem({...editingItem, consultation_fee: parseFloat(e.target.value) || 0})}
                  min="0"
                />
                <Input
                  label="Start Time"
                  type="time"
                  value={editingItem.available_hours?.start || '09:00'}
                  onChange={(e) => setEditingItem({
                    ...editingItem, 
                    available_hours: {...(editingItem.available_hours || {}), start: e.target.value}
                  })}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={editingItem.available_hours?.end || '17:00'}
                  onChange={(e) => setEditingItem({
                    ...editingItem, 
                    available_hours: {...(editingItem.available_hours || {}), end: e.target.value}
                  })}
                />
              </div>
              <Input
                label="Max Patients Per Day"
                type="number"
                value={editingItem.max_patients_per_day}
                onChange={(e) => setEditingItem({...editingItem, max_patients_per_day: parseInt(e.target.value) || 50})}
                min="1"
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Available Days
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingItem.available_days?.includes(day) || false}
                        onChange={(e) => {
                          const days = editingItem.available_days || [];
                          if (e.target.checked) {
                            setEditingItem({...editingItem, available_days: [...days, day]});
                          } else {
                            setEditingItem({...editingItem, available_days: days.filter(d => d !== day)});
                          }
                        }}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm capitalize">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Select
                label="Status"
                value={editingItem.status}
                onChange={(e) => setEditingItem({...editingItem, status: e.target.value})}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'on_leave', label: 'On Leave' }
                ]}
                required
              />
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingItem(null);
                setError('');
              }}
              className="flex-1"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (isDepartment) {
                  saveDepartment(editingItem);
                } else if (isDoctor) {
                  saveDoctor(editingItem);
                }
              }}
              className="flex-1"
              loading={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="System Settings & Configuration" size="xl">
        <div className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'general', label: 'General Settings', icon: Settings },
                { key: 'departments', label: `Departments (${departments.length})`, icon: Building2 },
                { key: 'doctors', label: `Doctors (${doctors.length})`, icon: Users },
                { key: 'payment', label: 'Payment Settings', icon: DollarSign },
                { key: 'daycare', label: 'Day Care Settings', icon: Bed },
                { key: 'pharmacy', label: 'Pharmacy Settings', icon: Pill },
                { key: 'rooms', label: 'Room Settings', icon: Building2 }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    activeTab === key
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                <p className="text-slate-600 mt-2">Loading settings...</p>
              </div>
            ) : (
              <>
                {activeTab === 'general' && renderGeneralSettings()}
                {activeTab === 'departments' && renderDepartments()}
                {activeTab === 'doctors' && renderDoctors()}
                {activeTab === 'payment' && (
                  <div className="space-y-6">
                    {settings.filter(s => s.setting_type === 'payment').map((setting) => (
                      <div key={setting.setting_key} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-slate-600">{setting.description}</p>
                        </div>
                        <div className="w-64 ml-4">
                          {setting.setting_key === 'enable_online_payments' ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={setting.setting_value}
                                onChange={(e) => updateSetting(setting.setting_key, e.target.checked)}
                                disabled={saving}
                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                              />
                              <span className="text-sm text-slate-700">
                                {setting.setting_value ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                          ) : setting.setting_key.includes('percent') ? (
                            <Input
                              type="number"
                              value={setting.setting_value}
                              onChange={(e) => updateSetting(setting.setting_key, parseInt(e.target.value) || 0)}
                              disabled={saving}
                              min="0"
                              max="100"
                            />
                          ) : (
                            <Input
                              type={setting.setting_key.includes('secret') ? 'password' : 'text'}
                              value={setting.setting_value}
                              onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
                              disabled={saving}
                              placeholder={setting.setting_key.includes('key') ? 'Enter your Stripe key' : ''}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'daycare' && (
                  <div className="space-y-6">
                    {settings.filter(s => s.setting_type === 'daycare').map((setting) => (
                      <div key={setting.setting_key} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-slate-600">{setting.description}</p>
                        </div>
                        <div className="w-64 ml-4">
                          <Input
                            type="number"
                            value={setting.setting_value}
                            onChange={(e) => updateSetting(setting.setting_key, parseInt(e.target.value) || 0)}
                            disabled={saving}
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'pharmacy' && (
                  <div className="space-y-6">
                    {settings.filter(s => s.setting_type === 'pharmacy').map((setting) => (
                      <div key={setting.setting_key} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-slate-600">{setting.description}</p>
                        </div>
                        <div className="w-64 ml-4">
                          <Input
                            type="number"
                            value={setting.setting_value}
                            onChange={(e) => updateSetting(setting.setting_key, parseInt(e.target.value) || 0)}
                            disabled={saving}
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'rooms' && (
                  <div className="space-y-6">
                    {settings.filter(s => s.setting_type === 'rooms').map((setting) => (
                      <div key={setting.setting_key} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-slate-600">{setting.description}</p>
                        </div>
                        <div className="w-64 ml-4">
                          <Input
                            type="number"
                            value={setting.setting_value}
                            onChange={(e) => updateSetting(setting.setting_key, parseInt(e.target.value) || 0)}
                            disabled={saving}
                            min="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>

      {renderEditModal()}
    </>
  );
};