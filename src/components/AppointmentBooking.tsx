import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Stethoscope,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  Users,
  Activity
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { supabase } from '../lib/supabase';
import { Appointment, Doctor, Patient, Department } from '../types';
import { formatDate, formatTime } from '../lib/utils';

interface AppointmentBookingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ isOpen, onClose }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [bookingForm, setBookingForm] = useState({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    patient_age: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    duration_minutes: 30,
    notes: '',
    department: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          doctor:doctors(*),
          visit:visits(*)
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      // Fetch doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('*')
        .eq('status', 'active')
        .order('name');

      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      // Fetch recent patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (appointmentsError) throw appointmentsError;
      if (doctorsError) throw doctorsError;
      if (departmentsError) throw departmentsError;
      if (patientsError) throw patientsError;

      setAppointments(appointmentsData || []);
      setDoctors(doctorsData || []);
      setDepartments(departmentsData || []);
      setPatients(patientsData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError('Failed to load appointment data');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!bookingForm.patient_name || !bookingForm.patient_phone || !bookingForm.doctor_id || 
        !bookingForm.appointment_date || !bookingForm.appointment_time) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if patient exists or create new one
      let patient = patients.find(p => p.phone === bookingForm.patient_phone);
      
      if (!patient) {
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            uid: `CLN1-${Date.now().toString(36).toUpperCase()}`,
            name: bookingForm.patient_name,
            phone: bookingForm.patient_phone,
            email: bookingForm.patient_email || null,
            age: parseInt(bookingForm.patient_age) || 25
          })
          .select()
          .single();

        if (patientError) throw patientError;
        patient = newPatient;
      }

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patient.id,
          doctor_id: bookingForm.doctor_id,
          appointment_date: bookingForm.appointment_date,
          appointment_time: bookingForm.appointment_time,
          duration_minutes: bookingForm.duration_minutes,
          notes: bookingForm.notes,
          status: 'scheduled'
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          recipient_type: 'patient',
          recipient_id: patient.uid,
          title: 'Appointment Scheduled',
          message: `Your appointment with Dr. ${doctors.find(d => d.id === bookingForm.doctor_id)?.name} is scheduled for ${formatDate(bookingForm.appointment_date)} at ${bookingForm.appointment_time}`,
          type: 'info'
        });

      setSuccess('Appointment booked successfully!');
      setShowBookingForm(false);
      resetBookingForm();
      fetchData();

    } catch (error: any) {
      console.error('Error booking appointment:', error);
      setError(error.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointment = async (appointmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      setSuccess(`Appointment ${status} successfully`);
      fetchData();

    } catch (error: any) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment');
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      setSuccess('Appointment deleted successfully');
      fetchData();

    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      setError('Failed to delete appointment');
    }
  };

  const resetBookingForm = () => {
    setBookingForm({
      patient_name: '',
      patient_phone: '',
      patient_email: '',
      patient_age: '',
      doctor_id: '',
      appointment_date: '',
      appointment_time: '',
      duration_minutes: 30,
      notes: '',
      department: ''
    });
  };

  const getFilteredAppointments = () => {
    let filtered = appointments;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(apt => 
        apt.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.patient?.phone.includes(searchQuery) ||
        apt.doctor?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Doctor filter
    if (doctorFilter) {
      filtered = filtered.filter(apt => apt.doctor_id === doctorFilter);
    }

    // Date filter
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(apt => apt.appointment_date === today);
        break;
      case 'tomorrow':
        filtered = filtered.filter(apt => apt.appointment_date === tomorrow);
        break;
      case 'week':
        filtered = filtered.filter(apt => apt.appointment_date >= today && apt.appointment_date <= weekFromNow);
        break;
      case 'upcoming':
        filtered = filtered.filter(apt => apt.appointment_date >= today);
        break;
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredAppointments = getFilteredAppointments();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Appointment Management" size="xl">
      <div className="space-y-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-800">{success}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSuccess('')}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setError('')}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Header with Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Appointments</p>
                  <p className="text-2xl font-bold text-blue-900">{appointments.length}</p>
                </div>
                <CalendarDays className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Today's Appointments</p>
                  <p className="text-2xl font-bold text-green-900">
                    {appointments.filter(apt => apt.appointment_date === new Date().toISOString().split('T')[0]).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Active Doctors</p>
                  <p className="text-2xl font-bold text-purple-900">{doctors.length}</p>
                </div>
                <Stethoscope className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Pending</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {appointments.filter(apt => apt.status === 'scheduled').length}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'no_show', label: 'No Show' }
              ]}
            />
            <Select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              options={[
                { value: '', label: 'All Doctors' },
                ...doctors.map(doctor => ({
                  value: doctor.id,
                  label: doctor.name
                }))
              ]}
            />
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'tomorrow', label: 'Tomorrow' },
                { value: 'week', label: 'This Week' },
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'all', label: 'All Dates' }
              ]}
            />
          </div>
          <Button onClick={() => setShowBookingForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
        </div>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Appointments ({filteredAppointments.length})
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {appointment.patient?.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {appointment.patient?.phone} • Age: {appointment.patient?.age}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            Dr. {appointment.doctor?.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment.doctor?.specialization}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(appointment.appointment_date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {appointment.appointment_time} ({appointment.duration_minutes}min)
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                          {appointment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-100 p-2 rounded">
                          {appointment.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {appointment.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateAppointment(appointment.id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                      )}
                      
                      {appointment.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateAppointment(appointment.id, 'in_progress')}
                        >
                          Start
                        </Button>
                      )}
                      
                      {appointment.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateAppointment(appointment.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingAppointment(appointment);
                          setShowBookingForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteAppointment(appointment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No appointments found matching your criteria.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Form Modal */}
      <Modal
        isOpen={showBookingForm}
        onClose={() => {
          setShowBookingForm(false);
          setEditingAppointment(null);
          resetBookingForm();
        }}
        title={editingAppointment ? 'Edit Appointment' : 'Book New Appointment'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Patient Name"
              value={bookingForm.patient_name}
              onChange={(e) => setBookingForm({...bookingForm, patient_name: e.target.value})}
              placeholder="Enter patient name"
              required
            />
            <Input
              label="Phone Number"
              value={bookingForm.patient_phone}
              onChange={(e) => setBookingForm({...bookingForm, patient_phone: e.target.value})}
              placeholder="Enter phone number"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Email (Optional)"
              type="email"
              value={bookingForm.patient_email}
              onChange={(e) => setBookingForm({...bookingForm, patient_email: e.target.value})}
              placeholder="Enter email"
            />
            <Input
              label="Age"
              type="number"
              value={bookingForm.patient_age}
              onChange={(e) => setBookingForm({...bookingForm, patient_age: e.target.value})}
              placeholder="Enter age"
              min="1"
              max="120"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="Department"
              value={bookingForm.department}
              onChange={(e) => {
                setBookingForm({...bookingForm, department: e.target.value});
                // Filter doctors by department
                setBookingForm({...bookingForm, department: e.target.value, doctor_id: ''});
              }}
              options={[
                { value: '', label: 'Select Department' },
                ...departments.map(dept => ({
                  value: dept.name,
                  label: dept.display_name
                }))
              ]}
              required
            />
            <Select
              label="Doctor"
              value={bookingForm.doctor_id}
              onChange={(e) => setBookingForm({...bookingForm, doctor_id: e.target.value})}
              options={[
                { value: '', label: 'Select Doctor' },
                ...doctors
                  .filter(doctor => !bookingForm.department || doctor.specialization === bookingForm.department)
                  .map(doctor => ({
                    value: doctor.id,
                    label: `${doctor.name} - ₹${doctor.consultation_fee}`
                  }))
              ]}
              required
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Appointment Date"
              type="date"
              value={bookingForm.appointment_date}
              onChange={(e) => setBookingForm({...bookingForm, appointment_date: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <Input
              label="Appointment Time"
              type="time"
              value={bookingForm.appointment_time}
              onChange={(e) => setBookingForm({...bookingForm, appointment_time: e.target.value})}
              required
            />
            <Input
              label="Duration (minutes)"
              type="number"
              value={bookingForm.duration_minutes}
              onChange={(e) => setBookingForm({...bookingForm, duration_minutes: parseInt(e.target.value) || 30})}
              min="15"
              max="120"
              step="15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
              placeholder="Any special notes or requirements..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowBookingForm(false);
                setEditingAppointment(null);
                resetBookingForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookAppointment}
              loading={loading}
              className="flex-1"
            >
              {editingAppointment ? 'Update Appointment' : 'Book Appointment'}
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};