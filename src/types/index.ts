export interface Patient {
  id: string;
  uid: string;
  name: string;
  age: number;
  phone: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  blood_group?: string;
  allergies?: string[];
  medical_conditions?: string[];
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  clinic_id: string;
  stn: number;
  department: string;
  visit_date: string;
  status: 'waiting' | 'checked_in' | 'in_service' | 'completed' | 'held' | 'expired';
  payment_status: 'paid' | 'pending' | 'pay_at_clinic' | 'refunded';
  payment_provider?: string;
  payment_ref?: string;
  qr_payload: string;
  estimated_time?: string;
  doctor_id?: string;
  created_at: string;
  updated_at: string;
  checked_in_at?: string;
  completed_at?: string;
  patient?: Patient;
  doctor?: Doctor;
  medical_history?: MedicalHistory[];
  payment_transactions?: PaymentTransaction[];
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification?: string;
  experience_years: number;
  consultation_fee: number;
  available_days: string[];
  available_hours: {
    start: string;
    end: string;
  };
  max_patients_per_day: number;
  status: 'active' | 'inactive' | 'on_leave';
  created_at: string;
  updated_at: string;
}

export interface MedicalHistory {
  id: string;
  patient_uid: string;
  visit_id?: string;
  doctor_id?: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  attachments?: any[];
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
  visit?: Visit;
}

export interface Department {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  consultation_fee: number;
  average_consultation_time: number;
  color_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicSettings {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'general' | 'payment' | 'notification' | 'queue' | 'doctor';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  visit_id: string;
  patient_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'online' | 'insurance';
  transaction_id?: string;
  gateway_response?: any;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  processed_by?: string;
  processed_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_type: 'patient' | 'admin' | 'doctor';
  recipient_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  metadata?: any;
  created_at: string;
}

export interface QueueStatus {
  now_serving: number;
  total_waiting: number;
  current_position?: number;
  estimated_wait_minutes?: number;
  department_stats?: DepartmentStats[];
}

export interface DepartmentStats {
  department: string;
  display_name: string;
  color_code: string;
  now_serving: number;
  total_waiting: number;
  total_completed: number;
  average_wait_time: number;
  doctor_count: number;
}

export interface BookingRequest {
  name: string;
  age: number;
  phone: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  blood_group?: string;
  allergies?: string;
  medical_conditions?: string;
  department: string;
  doctor_id?: string;
  payment_mode: 'pay_now' | 'pay_at_clinic';
  notes?: string;
}

export interface BookingResponse {
  uid: string;
  visit_id: string;
  stn: number;
  department: string;
  visit_date: string;
  payment_status: string;
  qr_payload: string;
  estimated_wait_minutes: number;
  now_serving: number;
  position: number;
  qr_code_url?: string;
  appointment_time?: string;
  daycare_type?: string;
  duration_hours?: number;
  total_cost?: number;
  doctor?: Doctor;
}

export interface Analytics {
  today: {
    total_visits: number;
    completed_visits: number;
    revenue: number;
    average_wait_time: number;
  };
  weekly: {
    visits_trend: number[];
    revenue_trend: number[];
    department_distribution: { [key: string]: number };
  };
  monthly: {
    total_visits: number;
    total_revenue: number;
    top_departments: { department: string; count: number }[];
    patient_satisfaction: number;
  };
}

export interface TimeSlot {
  time: string;
  available: boolean;
  doctor_id: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: 'consultation' | 'follow_up' | 'check_up' | 'procedure' | 'vaccination';
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority: 'normal' | 'high' | 'urgent';
  notes?: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface DaycareBooking {
  id: string;
  patient_id: string;
  daycare_type: 'observation' | 'recovery' | 'dialysis' | 'chemotherapy' | 'physiotherapy';
  booking_date: string;
  duration_hours: number;
  special_requirements?: string;
  attendant_required: boolean;
  meal_preferences?: string;
  total_cost: number;
  status: 'booked' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  patient?: Patient;
}

export interface AdmissionRecord {
  id: string;
  patient_id: string;
  visit_id: string;
  doctor_id: string;
  admission_type: 'emergency' | 'planned' | 'observation' | 'surgery';
  ward_type: 'general' | 'private' | 'icu' | 'semi_private';
  room_id: string;
  admission_date: string;
  discharge_date?: string;
  estimated_duration: number;
  actual_duration?: number;
  reason: string;
  special_requirements?: string;
  insurance_details?: string;
  total_estimated_cost: number;
  final_bill_amount?: number;
  status: 'pending' | 'approved' | 'admitted' | 'discharged';
  paperwork_completed: any;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  manufacturer: string;
  batch_number: string;
  expiry_date: string;
  price: number;
  stock_quantity: number;
  unit: string;
  category: string;
  prescription_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface PharmacyBill {
  id: string;
  patient_id: string;
  prescription_id?: string;
  items: any[];
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  payment_method: 'cash' | 'card' | 'upi' | 'insurance';
  created_at: string;
  patient?: Patient;
}

export interface DoctorSession {
  id: string;
  doctor_id: string;
  session_status: 'active' | 'inactive' | 'break';
  room_name: string;
  started_at: string;
  ended_at?: string;
  current_patient_id?: string;
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
  current_patient?: Patient;
}

export interface Consultation {
  id: string;
  doctor_id: string;
  patient_id: string;
  visit_id: string;
  session_id: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  priority_level: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
  patient?: Patient;
  visit?: Visit;
  consultation_notes?: ConsultationNote[];
  voice_transcriptions?: VoiceTranscription[];
}

export interface ConsultationNote {
  id: string;
  consultation_id: string;
  doctor_id: string;
  note_type: 'general' | 'symptoms' | 'diagnosis' | 'prescription' | 'follow_up' | 'voice_note';
  content: string;
  is_voice_generated: boolean;
  voice_confidence_score?: number;
  created_at: string;
  updated_at: string;
}

export interface VoiceTranscription {
  id: string;
  consultation_id: string;
  doctor_id: string;
  original_audio_url?: string;
  transcribed_text: string;
  confidence_score?: number;
  language_code: string;
  processing_status: 'processing' | 'completed' | 'failed';
  created_at: string;
}