import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CreditCard, Building2, Bed, Pill } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Department, Doctor, TimeSlot } from '../types';
import { formatDate, formatTime } from '../lib/utils';

interface AppointmentBookingProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointment: any) => void;
}

export const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [bookingType, setBookingType] = useState<'walk_in' | 'appointment' | 'daycare'>('walk_in');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Patient Info
    name: '',
    age: 0,
    phone: '',
    email: '',
    address: '',
    emergency_contact: '',
    blood_group: '',
    allergies: '',
    medical_conditions: '',
    
    // Appointment Info
    department: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'consultation',
    priority: 'normal',
    notes: '',
    
    // Day Care Info (for daycare bookings)
    daycare_type: '',
    duration_hours: 8,
    special_requirements: '',
    attendant_required: false,
    meal_preferences: '',
    
    // Payment
    payment_mode: 'pay_at_clinic',
    advance_payment: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      fetchDoctors();
      setMinDate();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedDoctor]);

  const setMinDate = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (bookingType === 'walk_in') {
      setSelectedDate(today.toISOString().split('T')[0]);
    } else {
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    }
  };

  const fetchDepartments = async () => {
    try {
      if (!isSupabaseConfigured) {
        setDepartments([
          {
            id: '1',
            name: 'general',
            display_name: 'General Medicine',
            description: 'General medical consultation',
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
            description: 'Heart specialist',
            consultation_fee: 800,
            average_consultation_time: 20,
            color_code: '#dc2626',
            is_active: true,
            created_at: '',
            updated_at: ''
          }
        ]);
        return;
      }

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      if (!isSupabaseConfigured) {
        setDoctors([
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
          }
        ]);
        return;
      }

      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const doctor = doctors.find(d => d.id === selectedDoctor);
      if (!doctor) return;

      const selectedDateObj = new Date(selectedDate);
      const dayName = selectedDateObj.toLocaleDateString('en-US', { weekday: 'lowercase' });

      if (!doctor.available_days.includes(dayName)) {
        setAvailableSlots([]);
        return;
      }

      // Generate time slots based on doctor's availability
      const startTime = doctor.available_hours.start;
      const endTime = doctor.available_hours.end;
      const consultationTime = doctor.average_consultation_time || 15;

      const slots: TimeSlot[] = [];
      const start = new Date(`2000-01-01T${startTime}:00`);
      const end = new Date(`2000-01-01T${endTime}:00`);

      while (start < end) {
        const timeString = start.toTimeString().slice(0, 5);
        
        // Check if slot is already booked (in real implementation)
        const isBooked = false; // This would check against existing appointments
        
        slots.push({
          time: timeString,
          available: !isBooked,
          doctor_id: selectedDoctor
        });

        start.setMinutes(start.getMinutes() + consultationTime);
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.name || !formData.phone || !formData.department) {
        throw new Error('Please fill in all required fields');
      }

      if (bookingType === 'appointment' && (!selectedDate || !selectedSlot)) {
        throw new Error('Please select date and time slot');
      }

      // Create appointment based on type
      let appointmentData;
      
      if (bookingType === 'walk_in') {
        // Walk-in booking (same day)
        appointmentData = await createWalkInAppointment();
      } else if (bookingType === 'appointment') {
        // Future appointment booking
        appointmentData = await createScheduledAppointment();
      } else if (bookingType === 'daycare') {
        // Day care facility booking
        appointmentData = await createDaycareBooking();
      }

      onSuccess(appointmentData);
      onClose();
      
    } catch (error: any) {
      setError(error.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createWalkInAppointment = async () => {
    // Implementation for walk-in appointments (existing logic)
    return { type: 'walk_in', message: 'Walk-in appointment created' };
  };

  const createScheduledAppointment = async () => {
    // Implementation for scheduled appointments
    return { 
      type: 'appointment', 
      date: selectedDate,
      time: selectedSlot,
      message: 'Appointment scheduled successfully' 
    };
  };

  const createDaycareBooking = async () => {
    // Implementation for daycare bookings
    return { 
      type: 'daycare', 
      duration: formData.duration_hours,
      message: 'Day care facility booked successfully' 
    };
  };

  const getMinDate = () => {
    const today = new Date();
    if (bookingType === 'walk_in') {
      return today.toISOString().split('T')[0];
    } else {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
  };

  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Medical Services" size="xl">
      <div className="space-y-6">
        {/* Booking Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className={`cursor-pointer transition-all border-2 ${
              bookingType === 'walk_in' 
                ? 'border-teal-500 bg-teal-50' 
                : 'border-gray-200 hover:border-teal-300'
            }`}
            onClick={() => setBookingType('walk_in')}
          >
            <CardContent className="pt-6 text-center">
              <User className="h-8 w-8 text-teal-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">Walk-in Today</h3>
              <p className="text-sm text-gray-600 mt-2">Get token for today's consultation</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all border-2 ${
              bookingType === 'appointment' 
                ? 'border-teal-500 bg-teal-50' 
                : 'border-gray-200 hover:border-teal-300'
            }`}
            onClick={() => setBookingType('appointment')}
          >
            <CardContent className="pt-6 text-center">
              <Calendar className="h-8 w-8 text-teal-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">Schedule Appointment</h3>
              <p className="text-sm text-gray-600 mt-2">Book for future date with time slot</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all border-2 ${
              bookingType === 'daycare' 
                ? 'border-teal-500 bg-teal-50' 
                : 'border-gray-200 hover:border-teal-300'
            }`}
            onClick={() => setBookingType('daycare')}
          >
            <CardContent className="pt-6 text-center">
              <Bed className="h-8 w-8 text-teal-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">Day Care</h3>
              <p className="text-sm text-gray-600 mt-2">Book day care facilities</p>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Patient Information</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter patient's full name"
                  required
                />
                <Input
                  label="Age *"
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  placeholder="Patient's age"
                  min="1"
                  max="120"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone Number *"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="10-digit phone number"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Blood Group"
                  value={formData.blood_group}
                  onChange={(e) => setFormData(prev => ({ ...prev, blood_group: e.target.value }))}
                  options={[
                    { value: '', label: 'Select Blood Group' },
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' }
                  ]}
                />
                <Input
                  label="Emergency Contact"
                  type="tel"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                  placeholder="Emergency contact number"
                />
              </div>

              <Input
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Complete address"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                  placeholder="e.g., Penicillin, Peanuts (comma separated)"
                />
                <Input
                  label="Medical Conditions"
                  value={formData.medical_conditions}
                  onChange={(e) => setFormData(prev => ({ ...prev, medical_conditions: e.target.value }))}
                  placeholder="e.g., Diabetes, Hypertension"
                />
              </div>
            </CardContent>
          </Card>

          {/* Service Selection */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Service Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Department *"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  options={[
                    { value: '', label: 'Select Department' },
                    ...departments.map(dept => ({
                      value: dept.name,
                      label: `${dept.display_name} - ₹${dept.consultation_fee}`
                    }))
                  ]}
                  required
                />

                {bookingType !== 'walk_in' && (
                  <Select
                    label="Preferred Doctor"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    options={[
                      { value: '', label: 'Any Available Doctor' },
                      ...doctors
                        .filter(d => d.specialization === formData.department)
                        .map(doctor => ({
                          value: doctor.id,
                          label: `${doctor.name} - ₹${doctor.consultation_fee}`
                        }))
                    ]}
                  />
                )}
              </div>

              {/* Date and Time Selection for Appointments */}
              {bookingType === 'appointment' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Appointment Date *"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    required
                  />

                  {availableSlots.length > 0 && (
                    <Select
                      label="Time Slot *"
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      options={[
                        { value: '', label: 'Select Time Slot' },
                        ...availableSlots
                          .filter(slot => slot.available)
                          .map(slot => ({
                            value: slot.time,
                            label: `${slot.time} - Available`
                          }))
                      ]}
                      required
                    />
                  )}
                </div>
              )}

              {/* Day Care Specific Fields */}
              {bookingType === 'daycare' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900">Day Care Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Day Care Type *"
                      value={formData.daycare_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, daycare_type: e.target.value }))}
                      options={[
                        { value: '', label: 'Select Day Care Type' },
                        { value: 'observation', label: 'Medical Observation - ₹2000/day' },
                        { value: 'recovery', label: 'Post-Surgery Recovery - ₹3000/day' },
                        { value: 'dialysis', label: 'Dialysis Day Care - ₹4000/day' },
                        { value: 'chemotherapy', label: 'Chemotherapy - ₹5000/day' },
                        { value: 'physiotherapy', label: 'Intensive Physiotherapy - ₹1500/day' }
                      ]}
                      required
                    />

                    <Input
                      label="Duration (Hours)"
                      type="number"
                      value={formData.duration_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 8 }))}
                      min="4"
                      max="24"
                      placeholder="8"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Special Requirements"
                      value={formData.special_requirements}
                      onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
                      placeholder="Any special medical requirements"
                    />

                    <Input
                      label="Meal Preferences"
                      value={formData.meal_preferences}
                      onChange={(e) => setFormData(prev => ({ ...prev, meal_preferences: e.target.value }))}
                      placeholder="Dietary restrictions or preferences"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="attendant_required"
                      checked={formData.attendant_required}
                      onChange={(e) => setFormData(prev => ({ ...prev, attendant_required: e.target.checked }))}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="attendant_required" className="text-sm font-medium text-gray-700">
                      Attendant Required (+₹500/day)
                    </label>
                  </div>
                </div>
              )}

              {/* Service Type for Appointments */}
              {bookingType === 'appointment' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Appointment Type"
                    value={formData.appointment_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointment_type: e.target.value }))}
                    options={[
                      { value: 'consultation', label: 'Regular Consultation' },
                      { value: 'follow_up', label: 'Follow-up Visit' },
                      { value: 'check_up', label: 'Health Check-up' },
                      { value: 'procedure', label: 'Minor Procedure' },
                      { value: 'vaccination', label: 'Vaccination' }
                    ]}
                  />

                  <Select
                    label="Priority"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    options={[
                      { value: 'normal', label: 'Normal' },
                      { value: 'high', label: 'High Priority (+₹200)' },
                      { value: 'urgent', label: 'Urgent (+₹500)' }
                    ]}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional information or special requirements"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    type="radio"
                    name="payment_mode"
                    value="pay_at_clinic"
                    checked={formData.payment_mode === 'pay_at_clinic'}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_mode: e.target.value as any }))}
                    className="sr-only"
                  />
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.payment_mode === 'pay_at_clinic'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="font-medium text-gray-900">Pay at Hospital</div>
                    <div className="text-sm text-gray-500">Pay when you arrive</div>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="payment_mode"
                    value="pay_now"
                    checked={formData.payment_mode === 'pay_now'}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_mode: e.target.value as any }))}
                    className="sr-only"
                  />
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.payment_mode === 'pay_now'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="font-medium text-gray-900">Pay Online</div>
                    <div className="text-sm text-gray-500">Secure online payment</div>
                    <div className="text-xs text-green-600 mt-1">💳 Get 5% discount</div>
                  </div>
                </label>
              </div>

              {(bookingType === 'daycare' || formData.payment_mode === 'pay_now') && (
                <Input
                  label="Advance Payment (₹)"
                  type="number"
                  value={formData.advance_payment || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, advance_payment: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter advance payment amount"
                  min="0"
                />
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              {bookingType === 'walk_in' ? 'Book Token' : 
               bookingType === 'appointment' ? 'Schedule Appointment' : 
               'Book Day Care'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};