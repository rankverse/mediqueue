import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { BookingRequest, Department, Doctor } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface BookingFormProps {
  onSubmit: (data: BookingRequest) => Promise<void>;
  loading: boolean;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onSubmit, loading }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);

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
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<BookingRequest>>({});

  React.useEffect(() => {
    fetchDepartments();
    fetchDoctors();
  }, []);

  React.useEffect(() => {
    if (formData.department) {
      const deptDoctors = doctors.filter(d => 
        d.specialization === formData.department && d.status === 'active'
      );
      setAvailableDoctors(deptDoctors);
    } else {
      setAvailableDoctors([]);
    }
  }, [formData.department, doctors]);

  const fetchDepartments = async () => {
    try {
      if (!isSupabaseConfigured) {
        // Demo departments
        setDepartments([
          {
            id: '1',
            name: 'general',
            display_name: 'General Medicine',
            description: 'General medical consultation',
            consultation_fee: 500,
            average_consultation_time: 15,
            color_code: '#059669',
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
        // Demo doctors
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

  const validateForm = (): boolean => {
    const newErrors: Partial<BookingRequest> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.age || formData.age < 1 || formData.age > 120) newErrors.age = 'Valid age is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (formData.phone.trim().replace(/\D/g, '').length < 10) newErrors.phone = 'Phone number must be at least 10 digits';
    if (!formData.department) newErrors.department = 'Department is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  const handleChange = (field: keyof BookingRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
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
    ...availableDoctors.map(doctor => ({
      value: doctor.id,
      label: `${doctor.name} - ₹${doctor.consultation_fee}`
    }))
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Book Your Medical Appointment</h3>
        <p className="text-gray-600">Please fill in your details for appointment booking</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            placeholder="Enter your full name"
            required
          />

          <Input
            label="Age"
            type="number"
            value={formData.age || ''}
            onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
            error={errors.age}
            placeholder="Enter your age"
            min="1"
            max="120"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            error={errors.phone}
            placeholder="Enter your phone number"
            required
          />

          <Select
            label="Department"
            value={formData.department}
            onChange={(e) => handleChange('department', e.target.value)}
            options={departmentOptions}
            error={errors.department}
            required
          />
        </div>

        {availableDoctors.length > 0 && (
          <Select
            label="Preferred Doctor (Optional)"
            value={formData.doctor_id || ''}
            onChange={(e) => handleChange('doctor_id', e.target.value)}
            options={doctorOptions}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email (Optional)"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Enter your email"
          />

          <Input
            label="Emergency Contact (Optional)"
            type="tel"
            value={formData.emergency_contact || ''}
            onChange={(e) => handleChange('emergency_contact', e.target.value)}
            placeholder="Emergency contact number"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Blood Group (Optional)"
            value={formData.blood_group || ''}
            onChange={(e) => handleChange('blood_group', e.target.value)}
            options={[
              { value: '', label: 'Select Blood Group' },
              { value: 'A+', label: 'A+' },
              { value: 'A-', label: 'A-' },
              { value: 'B+', label: 'B+' },
              { value: 'B-', label: 'B-' },
              { value: 'AB+', label: 'AB+' },
              { value: 'AB-', label: 'AB-' },
              { value: 'O+', label: 'O+' },
              { value: 'O-', label: 'O-' },
            ]}
          />

          <Input
            label="Address (Optional)"
            value={formData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Your address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Mode
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="relative">
              <input
                type="radio"
                name="payment_mode"
                value="pay_at_clinic"
                checked={formData.payment_mode === 'pay_at_clinic'}
                onChange={(e) => handleChange('payment_mode', e.target.value as 'pay_now' | 'pay_at_clinic')}
                className="sr-only"
              />
              <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                formData.payment_mode === 'pay_at_clinic'
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <div className="font-medium text-gray-900">Pay at Clinic</div>
                <div className="text-sm text-gray-500">Pay when you arrive</div>
              </div>
            </label>

            <label className="relative">
              <input
                type="radio"
                name="payment_mode"
                value="pay_now"
                checked={formData.payment_mode === 'pay_now'}
                onChange={(e) => handleChange('payment_mode', e.target.value as 'pay_now' | 'pay_at_clinic')}
                className="sr-only"
              />
              <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                formData.payment_mode === 'pay_now'
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <div className="font-medium text-gray-900">Pay Now</div>
                <div className="text-sm text-gray-500">Online payment (Secure)</div>
                <div className="text-xs text-green-600 mt-1">💳 Secure Payment</div>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-1">
            Allergies (Optional)
          </label>
          <Input
            id="allergies"
            value={formData.allergies || ''}
            onChange={(e) => handleChange('allergies', e.target.value)}
            placeholder="e.g., Penicillin, Peanuts (comma separated)"
          />
        </div>

        <div>
          <label htmlFor="medical_conditions" className="block text-sm font-medium text-gray-700 mb-1">
            Medical Conditions (Optional)
          </label>
          <Input
            id="medical_conditions"
            value={formData.medical_conditions || ''}
            onChange={(e) => handleChange('medical_conditions', e.target.value)}
            placeholder="e.g., Diabetes, Hypertension (comma separated)"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes (Optional)
          </label>
          <textarea
            id="notes"
            rows={2}
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Any additional information or special requirements..."
          />
        </div>

        <Button
          type="submit"
          loading={loading}
          className="w-full bg-teal-600 hover:bg-teal-700"
          size="lg"
        >
          Book Appointment
        </Button>
      </form>
    </div>
  );
};