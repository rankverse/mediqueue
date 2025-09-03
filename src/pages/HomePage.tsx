import React, { useState } from 'react';
import { Heart, Clock, Users, Calendar, QrCode, CheckCircle, Search, Play, Info, Stethoscope, Shield, Award, FileText, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { InteractiveGuide } from '../components/InteractiveGuide';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { QueueWidget } from '../components/QueueWidget';
import { Queue2DVisualization } from '../components/Queue2DVisualization';
import { BookingForm } from '../components/BookingForm';
import { PatientLookup } from '../components/PatientLookup';
import { PatientSelfLookup } from '../components/PatientSelfLookup';
import { useTranslation } from '../lib/translations';
import { BookingRequest, BookingResponse, DepartmentStats } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateUID } from '../lib/utils';
import { generateQRCode, QRPayload, downloadQRCode } from '../lib/qr';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { createPaymentIntent, confirmPayment } from '../lib/stripe';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showPatientLookup, setShowPatientLookup] = useState(false);
  const [showSelfLookup, setShowSelfLookup] = useState(false);
  const [showInteractiveGuide, setShowInteractiveGuide] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>('');
  const [stripeEnabled, setStripeEnabled] = useState<boolean>(false);
  const [showStripePayment, setShowStripePayment] = useState<boolean>(false);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(15);
  const [paymentError, setPaymentError] = useState<string>('');

  // Real-time updates
  useRealTimeUpdates(() => {
    fetchDepartmentStats();
  });

  // Auto-refresh with configurable interval
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchDepartmentStats();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchDepartmentStats = async () => {
    try {
      if (!isSupabaseConfigured) {
        setError('Database connection not configured. Please check your .env file with valid Supabase credentials.');
        setDepartmentStats([]);
        return;
      }

      setError('');
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true);

      if (deptError) throw deptError;

      if (!departments || departments.length === 0) {
        console.warn('No departments found, initializing defaults');
        await initializeDefaultDepartments();
        return;
      }
      
      const { data: visits } = await supabase
        .from('visits')
        .select('department, status, stn')
        .eq('visit_date', today);

      const { data: doctors } = await supabase
        .from('doctors')
        .select('specialization')
        .eq('status', 'active');

      const stats: DepartmentStats[] = departments.map(dept => {
        const deptVisits = visits?.filter(v => v.department === dept.name) || [];
        const waitingVisits = deptVisits.filter(v => ['waiting', 'checked_in'].includes(v.status));
        const completedVisits = deptVisits.filter(v => v.status === 'completed');
        const inServiceVisits = deptVisits.filter(v => v.status === 'in_service');
        
        let nowServing = 0;
        if (inServiceVisits.length > 0) {
          const inServiceSTNs = inServiceVisits.map((v: any) => v.stn);
          nowServing = Math.min(...inServiceSTNs);
        } else if (completedVisits.length > 0) {
          const completedSTNs = completedVisits.map((v: any) => v.stn);
          nowServing = Math.max(...completedSTNs);
        } else if (deptVisits.length > 0) {
          nowServing = Math.min(...deptVisits.map((v: any) => v.stn)) - 1;
        }

        const doctorCount = doctors?.filter(d => d.specialization === dept.name).length || 0;

        return {
          department: dept.name,
          display_name: dept.display_name,
          color_code: dept.color_code,
          now_serving: nowServing,
          total_waiting: waitingVisits.length,
          total_completed: completedVisits.length,
          average_wait_time: dept.average_consultation_time,
          doctor_count: doctorCount
        };
      });

      setDepartmentStats(stats);
    } catch (error) {
      console.error('Error fetching department stats:', error);
      if (!isSupabaseConfigured) {
        setError('Database not configured. Please set up your Supabase credentials.');
      } else {
        setError('Unable to load department information. Please refresh the page.');
      }
      setDepartmentStats([]);
    }
  };

  const initializeDefaultDepartments = async () => {
    try {
      const defaultDepartments = [
        {
          name: 'general',
          display_name: 'General Medicine',
          description: 'General medical consultation and treatment',
          consultation_fee: 500,
          average_consultation_time: 15,
          color_code: '#059669',
          is_active: true
        },
        {
          name: 'cardiology',
          display_name: 'Cardiology',
          description: 'Heart and cardiovascular system treatment',
          consultation_fee: 800,
          average_consultation_time: 20,
          color_code: '#DC2626',
          is_active: true
        },
        {
          name: 'orthopedics',
          display_name: 'Orthopedics',
          description: 'Bone, joint, and muscle treatment',
          consultation_fee: 700,
          average_consultation_time: 18,
          color_code: '#7C3AED',
          is_active: true
        },
        {
          name: 'pediatrics',
          display_name: 'Pediatrics',
          description: 'Child healthcare and treatment',
          consultation_fee: 600,
          average_consultation_time: 20,
          color_code: '#EA580C',
          is_active: true
        }
      ];

      const { error } = await supabase
        .from('departments')
        .insert(defaultDepartments);
      
      if (error) throw error;
      
      await fetchDepartmentStats();
    } catch (error) {
      console.error('Error initializing departments:', error);
    }
  };

  React.useEffect(() => {
    fetchDepartmentStats();
    checkMaintenanceMode();
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      if (!isSupabaseConfigured) {
        console.log('Skipping maintenance mode check - Supabase not configured');
        return;
      }

      const { data: maintenanceData } = await supabase
        .from('clinic_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_mode')
        .single();

      const { data: messageData } = await supabase
        .from('clinic_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_message')
        .single();

      const { data: stripeData } = await supabase
        .from('clinic_settings')
        .select('setting_value')
        .eq('setting_key', 'enable_online_payments')
        .single();

      if (maintenanceData) {
        setMaintenanceMode(maintenanceData.setting_value);
      }
      if (messageData) {
        setMaintenanceMessage(messageData.setting_value);
      }
      if (stripeData) {
        setStripeEnabled(stripeData.setting_value);
      }

      const { data: refreshData } = await supabase
        .from('clinic_settings')
        .select('setting_value')
        .eq('setting_key', 'auto_refresh_interval')
        .single();
      if (refreshData) {
        setRefreshInterval(refreshData.setting_value);
      }
    } catch (error) {
      console.log('Settings not found, using defaults');
    }
  };

  const handleBookToken = async (bookingData: BookingRequest) => {
    setBookingLoading(true);
    setError('');
    setSuccess('');
    
    if (!isSupabaseConfigured) {
      setError('Database not configured. Please contact support.');
      setBookingLoading(false);
      return;
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if patient exists by phone
      let { data: existingPatients, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', bookingData.phone)
        .limit(1);

      if (patientError) throw patientError;

      let patient = existingPatients?.[0];
      
      // Create new patient if doesn't exist
      if (!patient) {
        const uid = generateUID();
        
        const allergies = bookingData.allergies ? 
          bookingData.allergies.split(',').map(item => item.trim()).filter(Boolean) : 
          [];
        const medicalConditions = bookingData.medical_conditions ? 
          bookingData.medical_conditions.split(',').map(item => item.trim()).filter(Boolean) : 
          [];
        
        const { data: newPatient, error: createPatientError } = await supabase
          .from('patients')
          .insert({
            uid,
            name: bookingData.name,
            age: bookingData.age,
            phone: bookingData.phone,
            email: bookingData.email || null,
            address: bookingData.address || null,
            emergency_contact: bookingData.emergency_contact || null,
            blood_group: bookingData.blood_group || null,
            allergies: allergies.length > 0 ? allergies : null,
            medical_conditions: medicalConditions.length > 0 ? medicalConditions : null,
          })
          .select()
          .single();

        if (createPatientError) throw createPatientError;
        patient = newPatient;
      } else {
        // Update existing patient with new information if provided
        const allergies = bookingData.allergies ? 
          bookingData.allergies.split(',').map(item => item.trim()).filter(Boolean) : 
          [];
        const medicalConditions = bookingData.medical_conditions ? 
          bookingData.medical_conditions.split(',').map(item => item.trim()).filter(Boolean) : 
          [];

        const updateData: any = {};
        if (bookingData.email && bookingData.email !== patient.email) updateData.email = bookingData.email;
        if (bookingData.address && bookingData.address !== patient.address) updateData.address = bookingData.address;
        if (bookingData.emergency_contact && bookingData.emergency_contact !== patient.emergency_contact) updateData.emergency_contact = bookingData.emergency_contact;
        if (bookingData.blood_group && bookingData.blood_group !== patient.blood_group) updateData.blood_group = bookingData.blood_group;
        if (allergies.length > 0) updateData.allergies = allergies;
        if (medicalConditions.length > 0) updateData.medical_conditions = medicalConditions;

        if (Object.keys(updateData).length > 0) {
          updateData.updated_at = new Date().toISOString();
          const { error: updateError } = await supabase
            .from('patients')
            .update(updateData)
            .eq('id', patient.id);
          
          if (updateError) console.warn('Failed to update patient info:', updateError);
        }
      }

      // Get next STN for today and department
      const { data: existingVisits } = await supabase
        .from('visits')
        .select('stn')
        .eq('visit_date', today)
        .eq('department', bookingData.department)
        .order('stn', { ascending: false })
        .limit(1);

      const nextSTN = (existingVisits?.[0]?.stn || 0) + 1;

      // Create QR payload
      const qrPayload: QRPayload = {
        clinic: 'CLN1',
        uid: patient.uid,
        stn: nextSTN,
        visit_date: today,
        issued_at: Date.now(),
      };

      const qrCodeData = await generateQRCode(qrPayload);
      setQrCodeDataURL(qrCodeData);

      // Create visit record
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert({
          patient_id: patient.id,
          clinic_id: 'CLN1',
          stn: nextSTN,
          department: bookingData.department,
          visit_date: today,
          status: 'waiting',
          payment_status: bookingData.payment_mode === 'pay_now' ? 'pending' : 'pay_at_clinic',
          qr_payload: JSON.stringify(qrPayload),
          doctor_id: bookingData.doctor_id || null,
        })
        .select()
        .single();

      if (visitError) throw visitError;

      // Get current queue status
      const { data: queueData } = await supabase
        .from('visits')
        .select('stn, status')
        .eq('visit_date', today)
        .eq('department', bookingData.department);

      const inServiceVisits = queueData?.filter(v => v.status === 'in_service') || [];
      const completedVisits = queueData?.filter(v => v.status === 'completed') || [];
      
      let nowServing = 0;
      if (inServiceVisits.length > 0) {
        nowServing = Math.min(...inServiceVisits.map(v => v.stn));
      } else if (completedVisits.length > 0) {
        nowServing = Math.max(...completedVisits.map(v => v.stn));
      }

      const position = Math.max(0, nextSTN - nowServing);
      const estimatedWaitMinutes = position * 10;

      const result: BookingResponse = {
        uid: patient.uid,
        visit_id: visit.id,
        stn: nextSTN,
        department: bookingData.department,
        visit_date: today,
        payment_status: visit.payment_status,
        qr_payload: visit.qr_payload,
        estimated_wait_minutes: estimatedWaitMinutes,
        now_serving: nowServing,
        position,
      };

      setBookingResult(result);
      setShowBookingModal(false);
      setSuccess('Appointment booked successfully!');
      
      if (bookingData.payment_mode === 'pay_now' && stripeEnabled) {
        setShowStripePayment(true);
      } else {
        setShowConfirmationModal(true);
      }

    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to book appointment. Please try again.';
      setError(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeDataURL && bookingResult) {
      downloadQRCode(qrCodeDataURL, `clinic-token-${bookingResult.stn}.png`);
    }
  };

  const handleStripePayment = async () => {
    if (!bookingResult) return;
    
    setPaymentLoading(true);
    setPaymentError('');
    
    try {
      const { data: department } = await supabase
        .from('departments')
        .select('consultation_fee')
        .eq('name', bookingResult.department)
        .single();
      
      const amount = department?.consultation_fee || 500;
      
      const paymentIntent = await createPaymentIntent(amount, 'inr', {
        visit_id: bookingResult.visit_id,
        patient_uid: bookingResult.uid,
        department: bookingResult.department
      });
      
      const paymentResult = await confirmPayment(paymentIntent.client_secret, {
        card: {
          number: '4242424242424242',
          exp_month: 12,
          exp_year: 2025,
          cvc: '123'
        }
      });
      
      if (paymentResult.error) {
        throw new Error(paymentResult.error.message);
      }

      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          visit_id: bookingResult.visit_id,
          patient_id: bookingResult.visit_id,
          amount: amount,
          payment_method: 'online',
          transaction_id: paymentResult.paymentIntent.id,
          status: 'completed',
          gateway_response: paymentResult.paymentIntent,
          processed_at: new Date().toISOString()
        });

      if (transactionError) throw transactionError;

      const { error: visitError } = await supabase
        .from('visits')
        .update({ payment_status: 'paid' })
        .eq('id', bookingResult.visit_id);
      
      if (visitError) throw visitError;

      setShowStripePayment(false);
      setShowConfirmationModal(true);
      setSuccess('Payment processed successfully!');
      
    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentError(error instanceof Error ? error.message : 'Payment processing failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Show maintenance page if enabled
  if (maintenanceMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir={t('dir')}>
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-6xl mb-4">🔧</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Under Maintenance</h1>
            <p className="text-gray-600 mb-6">
              {maintenanceMessage || 'System is under maintenance. Please try again later.'}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={t('dir')}>
      {/* Medical Professional Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="bg-teal-600 rounded-lg p-2 mr-3">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t('clinic_name')}</h1>
                <p className="text-xs text-gray-600">Professional Healthcare Services</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <LanguageSwitcher />
              <Button variant="outline" onClick={() => setShowInteractiveGuide(true)} size="sm">
                <Play className="h-4 w-4 mr-2" />
                Guide
              </Button>
              <Button variant="outline" onClick={() => setShowSelfLookup(true)} size="sm">
                <Search className="h-4 w-4 mr-2" />
                Track by UID
              </Button>
              <Button variant="outline" onClick={() => setShowPatientLookup(true)} size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Medical Records
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-medium">System Notice</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <Button 
                onClick={() => setError('')} 
                variant="ghost"
                size="sm"
                className="ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <div className="text-green-400 mr-3">✅</div>
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
                Dismiss
              </Button>
            </div>
          </div>
        )}
        
        {/* Professional Hero Section */}
        <div className="text-center mb-12">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-teal-100 rounded-full p-4 mr-4">
                <Stethoscope className="h-12 w-12 text-teal-600" />
              </div>
              <div className="text-left">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Professional Healthcare Management
                </h2>
                <p className="text-lg text-gray-600">
                  Book appointments, track queues, and manage your healthcare efficiently
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Shield className="h-8 w-8 text-teal-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Secure & Private</h3>
                  <p className="text-sm text-gray-600">HIPAA compliant data protection</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Award className="h-8 w-8 text-teal-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Professional Care</h3>
                  <p className="text-sm text-gray-600">Qualified medical professionals</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="h-8 w-8 text-teal-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Time Efficient</h3>
                  <p className="text-sm text-gray-600">Minimal waiting times</p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => setShowBookingModal(true)}
              size="lg"
              className="bg-teal-600 hover:bg-teal-700 px-8 py-4 text-lg"
            >
              <Calendar className="mr-2 h-6 w-6" />
              Book Appointment
            </Button>
          </div>
        </div>

        {/* Interactive Guide Promotion */}
        <Card className="mb-8 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-teal-100 rounded-full p-3">
                  <Info className="h-8 w-8 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    First time using our system?
                  </h3>
                  <p className="text-gray-700">Take our 2-minute interactive guide to learn how to book and track appointments</p>
                </div>
              </div>
              <Button
                onClick={() => setShowInteractiveGuide(true)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Guide
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Queue Widget */}
        <QueueWidget />

        {/* Professional Queue Dashboard */}
        <Card className="mb-12 bg-white border border-gray-200 shadow-lg">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-3">
                <div className="bg-teal-600 rounded-full p-3">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Department Queue Status
                </h3>
                <div className="bg-green-500 rounded-full p-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Real-time monitoring of all department queues with live patient tracking and wait time estimates
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Queue2DVisualization 
              departmentStats={departmentStats}
              className="animate-fadeIn"
            />
          </CardContent>
        </Card>

        {/* Professional Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-8 pb-8">
              <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-Time Tracking</h3>
              <p className="text-gray-600">
                Monitor your queue position and estimated wait time with live updates every 15 seconds
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-8 pb-8">
              <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Digital Check-in</h3>
              <p className="text-gray-600">
                Contactless check-in with secure QR codes for a safe and efficient experience
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-8 pb-8">
              <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Digital Records</h3>
              <p className="text-gray-600">
                Access your complete medical history and download prescriptions anytime
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Professional Process Steps */}
        <Card className="mb-12">
          <CardHeader className="bg-gray-50">
            <h3 className="text-2xl font-bold text-center text-gray-900">How Our System Works</h3>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="space-y-4">
                <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-teal-600">1</span>
                </div>
                <h4 className="font-semibold text-gray-900">Book Online</h4>
                <p className="text-sm text-gray-600">Complete the appointment form with your medical details and preferred department</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-teal-600">2</span>
                </div>
                <h4 className="font-semibold text-gray-900">Receive Token</h4>
                <p className="text-sm text-gray-600">Get your unique appointment token and secure QR code instantly</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-teal-600">3</span>
                </div>
                <h4 className="font-semibold text-gray-900">Monitor Queue</h4>
                <p className="text-sm text-gray-600">Track your position and estimated wait time in real-time</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-teal-600">4</span>
                </div>
                <h4 className="font-semibold text-gray-900">Quick Check-in</h4>
                <p className="text-sm text-gray-600">Present your QR code for instant, contactless check-in</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Professional Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-teal-600 rounded-lg p-2 mr-3">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">MediQueue</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Professional Healthcare Management System
            </p>
            <p className="text-xs text-gray-500">
              Developed by{' '}
              <a 
                href="https://instagram.com/aftabxplained" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-teal-600 hover:text-teal-800"
              >
                Aftab Alam [ASOSE Lajpat Nagar]
              </a>
              {' '}| Follow: @aftabxplained
            </p>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Book Your Appointment"
        size="lg"
      >
        <BookingForm onSubmit={handleBookToken} loading={bookingLoading} />
      </Modal>

      {/* Enhanced Confirmation Modal */}
      <Modal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        title="Appointment Confirmed"
        size="lg"
      >
        {bookingResult && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h3>
              <p className="text-gray-600">Your appointment has been successfully booked</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Appointment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patient ID:</span>
                      <span className="font-medium font-mono">{bookingResult.uid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Token Number:</span>
                      <span className="font-bold text-teal-600 text-xl">#{bookingResult.stn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium capitalize">{bookingResult.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{bookingResult.visit_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className={`font-medium px-2 py-1 rounded text-xs ${
                        bookingResult.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        bookingResult.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {bookingResult.payment_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-50 rounded-lg p-4">
                  <h4 className="font-semibold text-teal-900 mb-3">Queue Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-teal-700">Currently Serving:</span>
                      <span className="font-bold text-teal-900">#{bookingResult.now_serving}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-teal-700">Your Position:</span>
                      <span className="font-bold text-teal-900">#{bookingResult.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-teal-700">Estimated Wait:</span>
                      <span className="font-bold text-teal-900">{bookingResult.estimated_wait_minutes} minutes</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-3">Your QR Code</h4>
                {qrCodeDataURL && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                      <img
                        src={qrCodeDataURL}
                        alt="Appointment QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <Button onClick={handleDownloadQR} variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download QR Code
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-semibold text-blue-800 mb-2">Important Instructions:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Save your QR code to your phone for easy access</li>
                <li>• Arrive 10 minutes before your estimated time</li>
                <li>• Present your QR code at reception for check-in</li>
                <li>• Monitor the live queue status on this page</li>
                <li>• Keep your phone charged for QR code display</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmationModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setShowConfirmationModal(false);
                  setShowSelfLookup(true);
                }} 
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                Track My Appointment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Patient Self Lookup Modal */}
      <PatientSelfLookup
        isOpen={showSelfLookup}
        onClose={() => setShowSelfLookup(false)}
      />

      {/* Admin Patient Lookup Modal */}
      <PatientLookup
        isOpen={showPatientLookup}
        onClose={() => setShowPatientLookup(false)}
      />

      {/* Interactive Guide Modal */}
      <InteractiveGuide
        isOpen={showInteractiveGuide}
        onClose={() => setShowInteractiveGuide(false)}
      />

      {/* Stripe Payment Modal */}
      <Modal
        isOpen={showStripePayment}
        onClose={() => setShowStripePayment(false)}
        title="Secure Payment Processing"
        size="md"
      >
        {bookingResult && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Payment</h3>
              <p className="text-gray-600">Complete your payment to confirm your appointment</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Token Number:</span>
                  <span className="font-bold">#{bookingResult.stn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium capitalize">{bookingResult.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consultation Fee:</span>
                  <span className="font-bold text-green-600">₹500</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Card Details</h4>
              <div className="space-y-3">
                <Input
                  label="Card Number"
                  placeholder="4242 4242 4242 4242"
                  defaultValue="4242 4242 4242 4242"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Expiry Date"
                    placeholder="MM/YY"
                    defaultValue="12/25"
                  />
                  <Input
                    label="CVC"
                    placeholder="123"
                    defaultValue="123"
                  />
                </div>
                <Input
                  label="Cardholder Name"
                  placeholder="John Doe"
                  defaultValue="John Doe"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                🔒 This is a demo payment system. Using test card: 4242 4242 4242 4242
              </p>
            </div>

            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{paymentError}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStripePayment(false);
                  setShowConfirmationModal(true);
                }}
                className="flex-1"
                disabled={paymentLoading}
              >
                Pay at Clinic
              </Button>
              <Button
                onClick={handleStripePayment}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                loading={paymentLoading}
              >
                Pay ₹500 Now
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};