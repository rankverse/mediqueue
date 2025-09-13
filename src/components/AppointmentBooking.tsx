import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CreditCard, Building2, Bed, Pill, Heart, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

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
          },
          {
            id: '4',
            name: 'pediatrics',
            display_name: 'Pediatrics',
            description: 'Child healthcare',
            consultation_fee: 600,
            average_consultation_time: 20,
            color_code: '#ea580c',
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
        const isBooked = Math.random() > 0.7; // Random availability for demo
        
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
      if (!formData.name || !formData.phone || !formData.age) {
        throw new Error('Please fill in all required fields (Name, Phone, Age)');
      }

      if (bookingType === 'appointment' && (!selectedDate || !selectedSlot)) {
        throw new Error('Please select date and time slot for appointment');
      }

      if (bookingType === 'daycare' && !daycareData.daycare_type) {
        throw new Error('Please select day care type');
      }

      if (!formData.department && bookingType !== 'daycare') {
        throw new Error('Please select a department');
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
      
    } catch (error: any) {
      setError(error.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createWalkInAppointment = async (): Promise<BookingResponse> => {
    const today = new Date().toISOString().split('T')[0];
    const uid = generateUID();
    
    // Get next STN for today and department
    const nextSTN = Math.floor(Math.random() * 50) + 1;

    // Create QR payload
    const qrPayload: QRPayload = {
      clinic: 'CLN1',
      uid: uid,
      stn: nextSTN,
      visit_date: today,
      issued_at: Date.now(),
    };

    const qrCodeDataURL = await generateQRCode(qrPayload);

    return {
      uid: uid,
      visit_id: 'visit-' + Date.now(),
      stn: nextSTN,
      department: formData.department,
      visit_date: today,
      payment_status: formData.payment_mode === 'pay_now' ? 'pending' : 'pay_at_clinic',
      qr_payload: JSON.stringify(qrPayload),
      qr_code_url: qrCodeDataURL,
      estimated_wait_minutes: nextSTN * 10,
      now_serving: Math.max(0, nextSTN - 5),
      position: Math.max(0, nextSTN - Math.max(0, nextSTN - 5)),
      service_type: 'walk_in'
    };
  };

  const createScheduledAppointment = async (): Promise<BookingResponse> => {
    const uid = generateUID();
    
    const qrPayload: QRPayload = {
      clinic: 'CLN1',
      uid: uid,
      stn: 0, // Appointments don't use STN
      visit_date: selectedDate,
      issued_at: Date.now(),
    };

    const qrCodeDataURL = await generateQRCode(qrPayload);

    return {
      uid: uid,
      visit_id: 'appointment-' + Date.now(),
      stn: 0,
      department: formData.department,
      visit_date: selectedDate,
      payment_status: formData.payment_mode === 'pay_now' ? 'pending' : 'pay_at_clinic',
      qr_payload: JSON.stringify(qrPayload),
      qr_code_url: qrCodeDataURL,
      estimated_wait_minutes: 0,
      now_serving: 0,
      position: 0,
      appointment_time: selectedSlot,
      doctor: doctors.find(d => d.id === selectedDoctor),
      service_type: 'appointment'
    };
  };

  const createDaycareBooking = async (): Promise<BookingResponse> => {
    const uid = generateUID();
    
    const qrPayload: QRPayload = {
      clinic: 'CLN1',
      uid: uid,
      stn: 0,
      visit_date: selectedDate,
      issued_at: Date.now(),
    };

    const qrCodeDataURL = await generateQRCode(qrPayload);

    return {
      uid: uid,
      visit_id: 'daycare-' + Date.now(),
      stn: 0,
      department: 'daycare',
      visit_date: selectedDate,
      payment_status: 'pending',
      qr_payload: JSON.stringify(qrPayload),
      qr_code_url: qrCodeDataURL,
      estimated_wait_minutes: 0,
      now_serving: 0,
      position: 0,
      daycare_type: daycareData.daycare_type,
      duration_hours: daycareData.duration_hours,
      total_cost: calculateDaycareCost(),
      service_type: 'daycare'
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

  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    const today = new Date();
    const minDate = new Date(getMinDate());
    const maxDate = new Date(getMaxDate());

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const isSelectable = date >= minDate && date <= maxDate;
      const isSelected = selectedDate === dateString;
      const isToday = date.toDateString() === today.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => isSelectable && setSelectedDate(dateString)}
          disabled={!isSelectable}
          className={`h-10 w-10 rounded-lg text-sm font-medium transition-all ${
            isSelected
              ? 'bg-teal-600 text-white shadow-lg'
              : isToday
              ? 'bg-teal-100 text-teal-800 border-2 border-teal-300'
              : isSelectable
              ? 'hover:bg-teal-50 text-slate-700'
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-slate-900">
            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h4>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-slate-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
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

  const nextStep = () => {
    if (currentStep === 1 && bookingType === 'walk_in') {
      setCurrentStep(3); // Skip date/time selection for walk-in
    } else {
      setCurrentStep(prev => Math.min(4, prev + 1));
    }
  };

  const prevStep = () => {
    if (currentStep === 3 && bookingType === 'walk_in') {
      setCurrentStep(1); // Skip date/time selection for walk-in
    } else {
      setCurrentStep(prev => Math.max(1, prev - 1));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Medical Services" size="xl">
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[
            { step: 1, label: 'Service Type', icon: Building2 },
            { step: 2, label: 'Date & Time', icon: Calendar },
            { step: 3, label: 'Patient Details', icon: User },
            { step: 4, label: 'Confirmation', icon: CheckCircle }
          ].map(({ step, label, icon: Icon }) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                step < currentStep ? 'border-green-500 bg-green-500 text-white' :
                step === currentStep ? 'border-teal-500 bg-teal-500 text-white' :
                'border-slate-300 text-slate-500'
              }`}>
                {step < currentStep ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <div className="ml-2 text-sm font-medium">
                {label}
              </div>
              {step < 4 && (
                <div className={`w-16 h-1 mx-4 ${
                  step < currentStep ? 'bg-green-500' : 'bg-slate-300'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Service Type Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Choose Your Service</h3>
              <p className="text-slate-600">Select the type of medical service you need</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card 
                className={`cursor-pointer transition-all border-2 hover:shadow-lg ${
                  bookingType === 'walk_in' 
                    ? 'border-teal-500 bg-teal-50 shadow-md' 
                    : 'border-slate-200 hover:border-teal-300'
                }`}
                onClick={() => {
                  setBookingType('walk_in');
                  setMinDate();
                }}
              >
                <CardContent className="pt-6 text-center">
                  <User className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Walk-in Today</h3>
                  <p className="text-sm text-slate-600 mb-3">Get token for today's consultation</p>
                  <div className="text-xs text-teal-600 font-medium bg-teal-100 px-2 py-1 rounded-full">
                    Same day service
                  </div>
                  <ul className="text-xs text-slate-500 mt-3 space-y-1">
                    <li>• Immediate token assignment</li>
                    <li>• Real-time queue tracking</li>
                    <li>• QR code for check-in</li>
                  </ul>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all border-2 hover:shadow-lg ${
                  bookingType === 'appointment' 
                    ? 'border-teal-500 bg-teal-50 shadow-md' 
                    : 'border-slate-200 hover:border-teal-300'
                }`}
                onClick={() => {
                  setBookingType('appointment');
                  setMinDate();
                }}
              >
                <CardContent className="pt-6 text-center">
                  <Calendar className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Schedule Appointment</h3>
                  <p className="text-sm text-slate-600 mb-3">Book for future date with time slot</p>
                  <div className="text-xs text-teal-600 font-medium bg-teal-100 px-2 py-1 rounded-full">
                    Up to 30 days advance
                  </div>
                  <ul className="text-xs text-slate-500 mt-3 space-y-1">
                    <li>• Choose specific date & time</li>
                    <li>• Select preferred doctor</li>
                    <li>• Guaranteed slot booking</li>
                  </ul>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all border-2 hover:shadow-lg ${
                  bookingType === 'daycare' 
                    ? 'border-teal-500 bg-teal-50 shadow-md' 
                    : 'border-slate-200 hover:border-teal-300'
                }`}
                onClick={() => {
                  setBookingType('daycare');
                  setMinDate();
                }}
              >
                <CardContent className="pt-6 text-center">
                  <Bed className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Day Care</h3>
                  <p className="text-sm text-slate-600 mb-3">Book day care facilities</p>
                  <div className="text-xs text-teal-600 font-medium bg-teal-100 px-2 py-1 rounded-full">
                    Extended care services
                  </div>
                  <ul className="text-xs text-slate-500 mt-3 space-y-1">
                    <li>• Observation & recovery</li>
                    <li>• Specialized treatments</li>
                    <li>• Attendant services</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time Selection (for appointments and daycare) */}
        {currentStep === 2 && bookingType !== 'walk_in' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {bookingType === 'appointment' ? 'Select Date & Time' : 'Select Date'}
              </h3>
              <p className="text-slate-600">
                {bookingType === 'appointment' 
                  ? 'Choose your preferred appointment date and time slot'
                  : 'Choose your day care booking date'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calendar */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-4">Select Date</h4>
                {renderCalendar()}
              </div>

              {/* Time Slots (for appointments only) */}
              {bookingType === 'appointment' && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4">
                    Available Time Slots
                    {selectedDate && (
                      <span className="text-sm font-normal text-slate-600 ml-2">
                        for {formatDate(selectedDate)}
                      </span>
                    )}
                  </h4>
                  
                  {!selectedDate && (
                    <div className="bg-slate-50 rounded-lg p-8 text-center border border-slate-200">
                      <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">Please select a date first</p>
                    </div>
                  )}

                  {selectedDate && !selectedDoctor && (
                    <div className="bg-slate-50 rounded-lg p-8 text-center border border-slate-200">
                      <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">Please select a department and doctor first</p>
                    </div>
                  )}

                  {selectedDate && selectedDoctor && (
                    <div className="space-y-4">
                      <Select
                        label="Select Doctor"
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        options={doctorOptions}
                        required
                      />

                      {availableSlots.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3">
                            Available Time Slots
                          </label>
                          <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                            {availableSlots
                              .filter(slot => slot.available)
                              .map(slot => (
                                <button
                                  key={slot.time}
                                  type="button"
                                  onClick={() => setSelectedSlot(slot.time)}
                                  className={`p-3 text-sm rounded-lg border transition-all ${
                                    selectedSlot === slot.time
                                      ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-md'
                                      : 'border-slate-300 hover:border-teal-300 hover:bg-teal-50'
                                  }`}
                                >
                                  <Clock className="h-4 w-4 mx-auto mb-1" />
                                  {slot.time}
                                </button>
                              ))}
                          </div>
                          {availableSlots.filter(slot => slot.available).length === 0 && (
                            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                              No available slots for selected date. Please choose another date.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Day Care Type Selection */}
              {bookingType === 'daycare' && selectedDate && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4">Day Care Services</h4>
                  <div className="space-y-3">
                    {[
                      { value: 'observation', label: 'Medical Observation', price: 2000, desc: '24/7 medical monitoring' },
                      { value: 'recovery', label: 'Post-Surgery Recovery', price: 3000, desc: 'Specialized recovery care' },
                      { value: 'dialysis', label: 'Dialysis Day Care', price: 4000, desc: 'Kidney dialysis treatment' },
                      { value: 'chemotherapy', label: 'Chemotherapy', price: 5000, desc: 'Cancer treatment sessions' },
                      { value: 'physiotherapy', label: 'Intensive Physiotherapy', price: 1500, desc: 'Physical rehabilitation' }
                    ].map(service => (
                      <Card
                        key={service.value}
                        className={`cursor-pointer transition-all border-2 ${
                          daycareData.daycare_type === service.value
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-slate-200 hover:border-teal-300'
                        }`}
                        onClick={() => setDaycareData(prev => ({ ...prev, daycare_type: service.value }))}
                      >
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-semibold text-slate-900">{service.label}</h5>
                              <p className="text-sm text-slate-600">{service.desc}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-teal-600">₹{service.price}</div>
                              <div className="text-xs text-slate-500">per day</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Patient Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Patient Information</h3>
              <p className="text-slate-600">Please provide your medical details</p>
            </div>

            {/* Service Selection for Walk-in */}
            {bookingType === 'walk_in' && (
              <Card className="bg-teal-50 border border-teal-200">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-teal-900 mb-3">Department Selection</h4>
                  <Select
                    label="Select Department *"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    options={departmentOptions}
                    required
                  />
                  {doctorOptions.length > 1 && (
                    <div className="mt-3">
                      <Select
                        label="Preferred Doctor"
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        options={doctorOptions}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Day Care Details */}
            {bookingType === 'daycare' && (
              <Card className="bg-purple-50 border border-purple-200">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-purple-900 mb-3">Day Care Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Duration (Hours) *"
                      type="number"
                      value={daycareData.duration_hours}
                      onChange={(e) => setDaycareData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 8 }))}
                      min="4"
                      max="24"
                      required
                    />
                    <div className="flex items-center space-x-2 mt-6">
                      <input
                        type="checkbox"
                        id="attendant_required"
                        checked={daycareData.attendant_required}
                        onChange={(e) => setDaycareData(prev => ({ ...prev, attendant_required: e.target.checked }))}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <label htmlFor="attendant_required" className="text-sm font-medium text-slate-700">
                        Attendant Required (+₹500/day)
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                  {daycareData.daycare_type && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
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
                </CardContent>
              </Card>
            )}

            {/* Patient Form */}
            <Card>
              <CardHeader>
                <h4 className="font-semibold text-slate-900">Personal Information</h4>
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
                    label="Email Address"
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional information or special requirements"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Selection */}
            <Card>
              <CardHeader>
                <h4 className="font-semibold text-slate-900">Payment Information</h4>
              </CardHeader>
              <CardContent>
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
                        : 'border-slate-300 hover:border-slate-400'
                    }`}>
                      <div className="font-medium text-slate-900">Pay at Hospital</div>
                      <div className="text-sm text-slate-500">Pay when you arrive</div>
                      <div className="text-xs text-blue-600 mt-1">💳 Cash, Card, UPI accepted</div>
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
                        : 'border-slate-300 hover:border-slate-400'
                    }`}>
                      <div className="font-medium text-slate-900">Pay Online</div>
                      <div className="text-sm text-slate-500">Secure online payment</div>
                      <div className="text-xs text-green-600 mt-1">💳 Get 5% discount</div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Your Booking</h3>
              <p className="text-slate-600">Please review your booking details</p>
            </div>

            <Card className="bg-slate-50 border border-slate-200">
              <CardContent className="pt-4">
                <h4 className="font-semibold text-slate-900 mb-4">Booking Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Service Type:</span>
                      <span className="font-medium capitalize">
                        {bookingType === 'walk_in' ? 'Walk-in Today' :
                         bookingType === 'appointment' ? 'Scheduled Appointment' :
                         'Day Care Facility'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Patient Name:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Age:</span>
                      <span className="font-medium">{formData.age} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Phone:</span>
                      <span className="font-medium">{formData.phone}</span>
                    </div>
                    {bookingType !== 'daycare' && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Department:</span>
                        <span className="font-medium capitalize">{formData.department}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date:</span>
                      <span className="font-medium">{formatDate(selectedDate)}</span>
                    </div>
                    {selectedSlot && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Time:</span>
                        <span className="font-medium">{selectedSlot}</span>
                      </div>
                    )}
                    {bookingType === 'daycare' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Service:</span>
                          <span className="font-medium capitalize">{daycareData.daycare_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Duration:</span>
                          <span className="font-medium">{daycareData.duration_hours} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total Cost:</span>
                          <span className="font-bold text-green-600">₹{calculateDaycareCost()}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">Payment:</span>
                      <span className="font-medium">
                        {formData.payment_mode === 'pay_now' ? 'Online Payment' : 'Pay at Hospital'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-semibold text-blue-900 mb-2">Important Information:</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You will receive a unique Patient ID (UID) for future reference</li>
                <li>• A QR code will be generated for quick check-in</li>
                <li>• You can track your appointment status in real-time</li>
                <li>• Arrive 10 minutes before your scheduled time</li>
                <li>• Keep your phone charged for QR code display</li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : prevStep}
          >
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>

          <div className="flex space-x-3">
            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && !bookingType) ||
                  (currentStep === 2 && bookingType === 'appointment' && (!selectedDate || !selectedSlot)) ||
                  (currentStep === 2 && bookingType === 'daycare' && (!selectedDate || !daycareData.daycare_type)) ||
                  (currentStep === 3 && (!formData.name || !formData.phone || !formData.age))
                }
                className="bg-teal-600 hover:bg-teal-700"
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={loading}
                disabled={
                  !formData.name || !formData.phone || !formData.age ||
                  (bookingType === 'appointment' && (!selectedDate || !selectedSlot)) ||
                  (bookingType === 'daycare' && (!selectedDate || !daycareData.daycare_type)) ||
                  (bookingType !== 'daycare' && !formData.department)
                }
                className="bg-teal-600 hover:bg-teal-700"
              >
                {bookingType === 'walk_in' ? 'Book Token' : 
                 bookingType === 'appointment' ? 'Schedule Appointment' : 
                 'Book Day Care'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};