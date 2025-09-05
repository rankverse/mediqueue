import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CreditCard, Building2, Bed, Pill } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Department, Doctor, TimeSlot, BookingRequest, BookingResponse } from '../types';
import { formatDate, formatTime, generateUID } from '../lib/utils';
import { generateQRCode, QRPayload } from '../lib/qr';

interface AppointmentBookingProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: BookingResponse) => void;
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

  const [formData, setFormData] = useState<BookingRequest>({
    name: '',
    age: 0,
    phone: '',
    email: '',
    address: '',
    emergency_contact: '',
    blood_group: '',
    allergies: '',
    medical_conditions: '',
    department: '',
    doctor_id: '',
    payment_mode: 'pay_at_clinic',
    notes: ''
  });

  const [daycareData, setDaycareData] = useState({
    daycare_type: '',
    duration_hours: 8,
    special_requirements: '',
    attendant_required: false,
    meal_preferences: '',
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
    if (selectedDate && selectedDoctor && bookingType === 'appointment') {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedDoctor, bookingType]);

  const setMinDate = () => {
    const today = new Date();
    if (bookingType === 'walk_in') {
      setSelectedDate(today.toISOString().split('T')[0]);
    } else {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
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
          },
          {
            id: '3',
            name: 'orthopedics',
            display_name: 'Orthopedics',
            description: 'Bone and joint specialist',
            consultation_fee: 700,
            average_consultation_time: 18,
            color_code: '#7c3aed',
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
      const consultationTime = 30; // 30-minute slots

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

      if (bookingType === 'daycare' && !daycareData.daycare_type) {
        throw new Error('Please select day care type');
      }

      let result: BookingResponse;
      
      if (bookingType === 'walk_in') {
        result = await createWalkInAppointment();
      } else if (bookingType === 'appointment') {
        result = await createScheduledAppointment();
      } else {
        result = await createDaycareBooking();
      }

      onSuccess(result);
      onClose();
      
    } catch (error: any) {
      setError(error.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createWalkInAppointment = async (): Promise<BookingResponse> => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if patient exists by phone
    let patient;
    if (isSupabaseConfigured) {
      const { data: existingPatients } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', formData.phone)
        .limit(1);

      patient = existingPatients?.[0];
    }
    
    // Create new patient if doesn't exist
    if (!patient) {
      const uid = generateUID();
      
      const allergies = formData.allergies ? 
        formData.allergies.split(',').map(item => item.trim()).filter(Boolean) : 
        [];
      const medicalConditions = formData.medical_conditions ? 
        formData.medical_conditions.split(',').map(item => item.trim()).filter(Boolean) : 
        [];
      
      if (isSupabaseConfigured) {
        const { data: newPatient, error: createPatientError } = await supabase
          .from('patients')
          .insert({
            uid,
            name: formData.name,
            age: formData.age,
            phone: formData.phone,
            email: formData.email || null,
            address: formData.address || null,
            emergency_contact: formData.emergency_contact || null,
            blood_group: formData.blood_group || null,
            allergies: allergies.length > 0 ? allergies : null,
            medical_conditions: medicalConditions.length > 0 ? medicalConditions : null,
          })
          .select()
          .single();

        if (createPatientError) throw createPatientError;
        patient = newPatient;
      } else {
        // Demo patient
        patient = {
          id: '1',
          uid,
          name: formData.name,
          age: formData.age,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          emergency_contact: formData.emergency_contact,
          blood_group: formData.blood_group,
          allergies,
          medical_conditions: medicalConditions,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    }

    // Get next STN for today and department
    let nextSTN = 1;
    if (isSupabaseConfigured) {
      const { data: existingVisits } = await supabase
        .from('visits')
        .select('stn')
        .eq('visit_date', today)
        .eq('department', formData.department)
        .order('stn', { ascending: false })
        .limit(1);

      nextSTN = (existingVisits?.[0]?.stn || 0) + 1;
    } else {
      nextSTN = Math.floor(Math.random() * 50) + 1;
    }

    // Create QR payload
    const qrPayload: QRPayload = {
      clinic: 'CLN1',
      uid: patient.uid,
      stn: nextSTN,
      visit_date: today,
      issued_at: Date.now(),
    };

    // Create visit record
    if (isSupabaseConfigured) {
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert({
          patient_id: patient.id,
          clinic_id: 'CLN1',
          stn: nextSTN,
          department: formData.department,
          visit_date: today,
          status: 'waiting',
          payment_status: formData.payment_mode === 'pay_now' ? 'pending' : 'pay_at_clinic',
          qr_payload: JSON.stringify(qrPayload),
          doctor_id: formData.doctor_id || null,
        })
        .select()
        .single();

      if (visitError) throw visitError;
    }

    return {
      uid: patient.uid,
      visit_id: 'demo-visit-id',
      stn: nextSTN,
      department: formData.department,
      visit_date: today,
      payment_status: formData.payment_mode === 'pay_now' ? 'pending' : 'pay_at_clinic',
      qr_payload: JSON.stringify(qrPayload),
      estimated_wait_minutes: nextSTN * 10,
      now_serving: Math.max(0, nextSTN - 5),
      position: Math.max(0, nextSTN - Math.max(0, nextSTN - 5))
    };
  };

  const createScheduledAppointment = async (): Promise<BookingResponse> => {
    // Similar to walk-in but for future dates
    const appointmentData = {
      ...formData,
      appointment_date: selectedDate,
      appointment_time: selectedSlot,
      appointment_type: 'consultation',
      priority: 'normal'
    };

    if (isSupabaseConfigured) {
      // Create appointment record
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (error) throw error;
    }

    return {
      uid: generateUID(),
      visit_id: 'appointment-' + Date.now(),
      stn: 0, // Appointments don't use STN
      department: formData.department,
      visit_date: selectedDate,
      payment_status: formData.payment_mode === 'pay_now' ? 'pending' : 'pay_at_clinic',
      qr_payload: JSON.stringify({ type: 'appointment', date: selectedDate, time: selectedSlot }),
      estimated_wait_minutes: 0,
      now_serving: 0,
      position: 0
    };
  };

  const createDaycareBooking = async (): Promise<BookingResponse> => {
    const bookingData = {
      ...formData,
      ...daycareData,
      booking_date: selectedDate,
      total_cost: calculateDaycareCost()
    };

    if (isSupabaseConfigured) {
      // Create daycare booking
      const { data, error } = await supabase
        .from('daycare_bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) throw error;
    }

    return {
      uid: generateUID(),
      visit_id: 'daycare-' + Date.now(),
      stn: 0,
      department: 'daycare',
      visit_date: selectedDate,
      payment_status: 'pending',
      qr_payload: JSON.stringify({ type: 'daycare', date: selectedDate }),
      estimated_wait_minutes: 0,
      now_serving: 0,
      position: 0
    };
  };

  const calculateDaycareCost = () => {
    const baseCosts: { [key: string]: number } = {
      'observation': 2000,
      'recovery': 3000,
      'dialysis': 4000,
      'chemotherapy': 5000,
      'physiotherapy': 1500
    };

    let cost = baseCosts[daycareData.daycare_type] || 2000;
    cost = (cost / 24) * daycareData.duration_hours; // Pro-rated for hours
    
    if (daycareData.attendant_required) {
      cost += 500;
    }

    return Math.round(cost);
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

  const departmentOptions = [
    { value: '', label: 'Select Department' },
    ...departments.map(dept => ({
      value: dept.name,
      label: `${dept.display_name} - ₹${dept.consultation_fee}`
    }))
  ];

  const doctorOptions = [
    { value: '', label: 'Any Available Doctor' },
    ...doctors
      .filter(d => d.specialization === formData.department)
      .map(doctor => ({
        value: doctor.id,
        label: `${doctor.name} - ₹${doctor.consultation_fee}`
      }))
  ];

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
              <div className="text-xs text-teal-600 mt-1">Same day service</div>
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
              <div className="text-xs text-teal-600 mt-1">Up to 30 days advance</div>
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
              <div className="text-xs text-teal-600 mt-1">Extended care services</div>
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
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Blood Group"
                  value={formData.blood_group || ''}
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
                  value={formData.emergency_contact || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                  placeholder="Emergency contact number"
                />
              </div>

              <Input
                label="Address"
                value={formData.address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Complete address"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Allergies"
                  value={formData.allergies || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                  placeholder="e.g., Penicillin, Peanuts (comma separated)"
                />
                <Input
                  label="Medical Conditions"
                  value={formData.medical_conditions || ''}
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
                  options={departmentOptions}
                  required
                />

                {doctorOptions.length > 1 && (
                  <Select
                    label="Preferred Doctor"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    options={doctorOptions}
                  />
                )}
              </div>

              {/* Date and Time Selection for Appointments */}
              {bookingType === 'appointment' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900">Appointment Scheduling</h4>
                  
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

                    {selectedDoctor && (
                      <Select
                        label="Preferred Doctor *"
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        options={doctorOptions}
                        required
                      />
                    )}
                  </div>

                  {availableSlots.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Time Slots *
                      </label>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {availableSlots
                          .filter(slot => slot.available)
                          .map(slot => (
                            <button
                              key={slot.time}
                              type="button"
                              onClick={() => setSelectedSlot(slot.time)}
                              className={`p-2 text-sm rounded border transition-all ${
                                selectedSlot === slot.time
                                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                                  : 'border-gray-300 hover:border-teal-300 hover:bg-teal-50'
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  <Select
                    label="Appointment Type"
                    value={formData.appointment_type || 'consultation'}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointment_type: e.target.value }))}
                    options={[
                      { value: 'consultation', label: 'Regular Consultation' },
                      { value: 'follow_up', label: 'Follow-up Visit' },
                      { value: 'check_up', label: 'Health Check-up' },
                      { value: 'procedure', label: 'Minor Procedure' },
                      { value: 'vaccination', label: 'Vaccination' }
                    ]}
                  />
                </div>
              )}

              {/* Day Care Specific Fields */}
              {bookingType === 'daycare' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900">Day Care Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Day Care Type *"
                      value={daycareData.daycare_type}
                      onChange={(e) => setDaycareData(prev => ({ ...prev, daycare_type: e.target.value }))}
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
                      value={daycareData.duration_hours}
                      onChange={(e) => setDaycareData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 8 }))}
                      min="4"
                      max="24"
                      placeholder="8"
                    />
                  </div>

                  <Input
                    label="Booking Date *"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Special Requirements"
                      value={daycareData.special_requirements}
                      onChange={(e) => setDaycareData(prev => ({ ...prev, special_requirements: e.target.value }))}
                      placeholder="Any special medical requirements"
                    />

                    <Input
                      label="Meal Preferences"
                      value={daycareData.meal_preferences}
                      onChange={(e) => setDaycareData(prev => ({ ...prev, meal_preferences: e.target.value }))}
                      placeholder="Dietary restrictions or preferences"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="attendant_required"
                      checked={daycareData.attendant_required}
                      onChange={(e) => setDaycareData(prev => ({ ...prev, attendant_required: e.target.checked }))}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="attendant_required" className="text-sm font-medium text-gray-700">
                      Attendant Required (+₹500/day)
                    </label>
                  </div>

                  {daycareData.daycare_type && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h5 className="font-semibold text-green-900 mb-2">Cost Estimation</h5>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Base cost ({daycareData.duration_hours} hours):</span>
                          <span>₹{calculateDaycareCost() - (daycareData.attendant_required ? 500 : 0)}</span>
                        </div>
                        {daycareData.attendant_required && (
                          <div className="flex justify-between">
                            <span>Attendant service:</span>
                            <span>₹500</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-1">
                          <span>Total:</span>
                          <span>₹{calculateDaycareCost()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes || ''}
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
                  value={daycareData.advance_payment || ''}
                  onChange={(e) => setDaycareData(prev => ({ ...prev, advance_payment: parseFloat(e.target.value) || 0 }))}
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