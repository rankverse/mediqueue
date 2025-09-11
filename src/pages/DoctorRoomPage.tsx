import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Users, 
  Clock, 
  Mic, 
  FileText, 
  UserPlus, 
  Phone, 
  Bed,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Activity,
  Heart,
  Pill,
  Calendar,
  Settings,
  LogOut,
  Play,
  Pause,
  Save,
  Trash2,
  Send,
  Bell,
  UserCheck,
  Building2,
  Clipboard,
  Download,
  Printer,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { VoiceNoteRecorder } from '../components/VoiceNoteRecorder';
import { useDoctorSession } from '../hooks/useDoctorSession';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Doctor, Visit, Patient, MedicalHistory } from '../types';
import { formatTime, formatDate } from '../lib/utils';

export const DoctorRoomPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [roomName, setRoomName] = useState('');
  const [showDoctorSelect, setShowDoctorSelect] = useState(true);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showNurseCallModal, setShowNurseCallModal] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Visit | null>(null);
  const [prescriptionData, setPrescriptionData] = useState({
    diagnosis: '',
    prescription: '',
    notes: '',
    follow_up_days: 0
  });
  const [admissionData, setAdmissionData] = useState({
    reason: '',
    admission_type: 'planned',
    ward_type: 'general',
    estimated_duration: 1,
    special_requirements: ''
  });
  const [referralData, setReferralData] = useState({
    department: '',
    reason: '',
    urgency: 'normal',
    notes: ''
  });
  const [nurseCallData, setNurseCallData] = useState({
    urgency: 'normal',
    reason: '',
    room_number: '',
    special_instructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    session,
    consultations,
    waitingPatients,
    startSession,
    endSession,
    updateSessionStatus,
    startConsultation,
    completeConsultation,
    callNextPatient,
    refetch
  } = useDoctorSession(selectedDoctor);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (session) {
      setRoomName(session.room_name);
    }
  }, [session]);

  const fetchDoctors = async () => {
    try {
      // Demo doctors data
      const demoDoctors: Doctor[] = [
        {
          id: 'doc1',
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
          id: 'doc2',
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
          id: 'doc3',
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
        }
      ];
      
      setDoctors(demoDoctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleStartSession = async () => {
    if (!selectedDoctor || !roomName.trim()) {
      setError('Please select doctor and enter room name');
      return;
    }

    setLoading(true);
    try {
      await startSession(roomName.trim());
      setShowDoctorSelect(false);
      setError('');
    } catch (error) {
      console.error('Error starting session:', error);
      setError('Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this session?')) return;

    setLoading(true);
    try {
      await endSession();
      setShowDoctorSelect(true);
      setSelectedDoctor('');
      setRoomName('');
      setError('');
    } catch (error) {
      console.error('Error ending session:', error);
      setError('Failed to end session');
    } finally {
      setLoading(false);
    }
  };

  const handleCallNextPatient = async () => {
    setLoading(true);
    try {
      const consultation = await callNextPatient();
      if (consultation) {
        const visit = waitingPatients.find(p => p.id === consultation.visit_id);
        setCurrentPatient(visit || null);
      }
      setError('');
    } catch (error) {
      console.error('Error calling next patient:', error);
      setError('Failed to call next patient');
    } finally {
      setLoading(false);
    }
  };

  const savePrescription = async () => {
    if (!currentPatient || !prescriptionData.diagnosis || !prescriptionData.prescription) {
      setError('Please fill in diagnosis and prescription');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('medical_history')
        .insert({
          patient_uid: currentPatient.patient?.uid,
          visit_id: currentPatient.id,
          doctor_id: selectedDoctor,
          diagnosis: prescriptionData.diagnosis,
          prescription: prescriptionData.prescription,
          notes: prescriptionData.notes
        });

      if (error) throw error;

      // Schedule follow-up if needed
      if (prescriptionData.follow_up_days > 0) {
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + prescriptionData.follow_up_days);
        
        await supabase
          .from('appointments')
          .insert({
            patient_id: currentPatient.patient_id,
            doctor_id: selectedDoctor,
            appointment_date: followUpDate.toISOString().split('T')[0],
            appointment_time: '10:00',
            appointment_type: 'follow_up',
            status: 'scheduled',
            notes: `Follow-up for: ${prescriptionData.diagnosis}`
          });
      }

      setShowPrescriptionModal(false);
      setPrescriptionData({ diagnosis: '', prescription: '', notes: '', follow_up_days: 0 });
      setError('');
      alert('Prescription saved successfully!');
    } catch (error) {
      console.error('Error saving prescription:', error);
      setError('Failed to save prescription');
    } finally {
      setLoading(false);
    }
  };

  const suggestAdmission = async () => {
    if (!currentPatient || !admissionData.reason) {
      setError('Please fill in admission reason');
      return;
    }

    setLoading(true);
    try {
      // Create admission request
      const admissionRequest = {
        patient_id: currentPatient.patient_id,
        visit_id: currentPatient.id,
        doctor_id: selectedDoctor,
        admission_type: admissionData.admission_type,
        ward_type: admissionData.ward_type,
        estimated_duration: admissionData.estimated_duration,
        reason: admissionData.reason,
        special_requirements: admissionData.special_requirements,
        status: 'pending',
        priority: admissionData.admission_type === 'emergency' ? 'urgent' : 'normal',
        created_at: new Date().toISOString()
      };

      // In real app, this would be saved to database
      console.log('Admission request created:', admissionRequest);

      // Create notification for admin
      await supabase
        .from('notifications')
        .insert({
          recipient_type: 'admin',
          title: 'New Admission Request',
          message: `Dr. ${doctors.find(d => d.id === selectedDoctor)?.name} has suggested admission for ${currentPatient.patient?.name}`,
          type: 'info',
          metadata: { admission_request: admissionRequest }
        });

      setShowAdmissionModal(false);
      setAdmissionData({ reason: '', admission_type: 'planned', ward_type: 'general', estimated_duration: 1, special_requirements: '' });
      setError('');
      alert('Admission request sent to admin successfully!');
    } catch (error) {
      console.error('Error suggesting admission:', error);
      setError('Failed to send admission request');
    } finally {
      setLoading(false);
    }
  };

  const sendReferral = async () => {
    if (!currentPatient || !referralData.department || !referralData.reason) {
      setError('Please fill in department and reason');
      return;
    }

    setLoading(true);
    try {
      // Create referral
      const referral = {
        patient_id: currentPatient.patient_id,
        from_doctor_id: selectedDoctor,
        to_department: referralData.department,
        reason: referralData.reason,
        urgency: referralData.urgency,
        notes: referralData.notes,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log('Referral created:', referral);

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          recipient_type: 'admin',
          title: 'New Department Referral',
          message: `Patient ${currentPatient.patient?.name} referred to ${referralData.department} department`,
          type: 'info',
          metadata: { referral }
        });

      setShowReferralModal(false);
      setReferralData({ department: '', reason: '', urgency: 'normal', notes: '' });
      setError('');
      alert('Referral sent successfully!');
    } catch (error) {
      console.error('Error sending referral:', error);
      setError('Failed to send referral');
    } finally {
      setLoading(false);
    }
  };

  const callNurse = async () => {
    if (!nurseCallData.reason) {
      setError('Please specify reason for calling nurse');
      return;
    }

    setLoading(true);
    try {
      const nurseCall = {
        doctor_id: selectedDoctor,
        patient_id: currentPatient?.patient_id,
        urgency: nurseCallData.urgency,
        reason: nurseCallData.reason,
        room_number: nurseCallData.room_number || roomName,
        special_instructions: nurseCallData.special_instructions,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log('Nurse call created:', nurseCall);

      // Create notification for nursing staff
      await supabase
        .from('notifications')
        .insert({
          recipient_type: 'admin',
          title: 'Nurse Call Request',
          message: `Dr. ${doctors.find(d => d.id === selectedDoctor)?.name} requests nurse assistance in ${roomName}`,
          type: nurseCallData.urgency === 'urgent' ? 'warning' : 'info',
          metadata: { nurse_call: nurseCall }
        });

      setShowNurseCallModal(false);
      setNurseCallData({ urgency: 'normal', reason: '', room_number: '', special_instructions: '' });
      setError('');
      alert('Nurse call sent successfully!');
    } catch (error) {
      console.error('Error calling nurse:', error);
      setError('Failed to call nurse');
    } finally {
      setLoading(false);
    }
  };

  const completeCurrentConsultation = async () => {
    if (!currentPatient) return;

    setLoading(true);
    try {
      const activeConsultation = consultations.find(c => 
        c.visit_id === currentPatient.id && c.status === 'in_progress'
      );

      if (activeConsultation) {
        await completeConsultation(activeConsultation.id);
      }

      setCurrentPatient(null);
      setError('');
    } catch (error) {
      console.error('Error completing consultation:', error);
      setError('Failed to complete consultation');
    } finally {
      setLoading(false);
    }
  };

  // Doctor Selection Screen
  if (showDoctorSelect || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="text-center">
              <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="h-8 w-8 text-teal-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Consultation Room</h1>
              <p className="text-gray-600 mt-2">Select your profile to start consultation session</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Select Doctor Profile *"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              options={[
                { value: '', label: 'Choose your doctor profile' },
                ...doctors.map(doctor => ({
                  value: doctor.id,
                  label: `${doctor.name} - ${doctor.specialization}`
                }))
              ]}
              required
            />

            <Input
              label="Room/Cabin Name *"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., Consultation Room 1, Cabin A"
              required
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <Button
              onClick={handleStartSession}
              loading={loading}
              disabled={!selectedDoctor || !roomName.trim()}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Consultation Session
            </Button>

            <div className="text-center pt-4 border-t">
              <Button variant="outline" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);
  const activeConsultation = consultations.find(c => c.status === 'in_progress');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="bg-teal-600 rounded-lg p-2 mr-3">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {selectedDoctorData?.name} - Consultation Room
                </h1>
                <p className="text-sm text-gray-600">
                  {roomName} • {selectedDoctorData?.specialization}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  session?.session_status === 'active' ? 'bg-green-500 animate-pulse' :
                  session?.session_status === 'break' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {session?.session_status === 'active' ? 'Active Session' :
                   session?.session_status === 'break' ? 'On Break' :
                   'Inactive'}
                </span>
              </div>
              
              <Button
                onClick={() => updateSessionStatus(session?.session_status === 'active' ? 'break' : 'active')}
                variant="outline"
                size="sm"
              >
                {session?.session_status === 'active' ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Take Break
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>

              <Button
                onClick={() => setShowNurseCallModal(true)}
                variant="outline"
                size="sm"
              >
                <Bell className="h-4 w-4 mr-2" />
                Call Nurse
              </Button>

              <Button onClick={handleEndSession} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                End Session
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
              <Button onClick={() => setError('')} variant="ghost" size="sm" className="ml-auto">×</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Patient */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-l-4 border-teal-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Current Patient</h3>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleCallNextPatient}
                      disabled={waitingPatients.length === 0 || activeConsultation}
                      size="sm"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Call Next
                    </Button>
                    <Button onClick={() => refetch()} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {currentPatient ? (
                  <div className="space-y-4">
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-teal-900 text-lg">{currentPatient.patient?.name}</h4>
                          <p className="text-teal-700">Token #{currentPatient.stn} • {currentPatient.patient?.uid}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-teal-700">Age: {currentPatient.patient?.age}</div>
                          <div className="text-sm text-teal-700">Phone: {currentPatient.patient?.phone}</div>
                        </div>
                      </div>
                      
                      {currentPatient.patient?.allergies && currentPatient.patient.allergies.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                            <span className="text-sm font-medium text-red-800">Allergies:</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {currentPatient.patient.allergies.map((allergy, index) => (
                              <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                {allergy}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentPatient.patient?.medical_conditions && currentPatient.patient.medical_conditions.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                          <div className="flex items-center">
                            <Heart className="h-4 w-4 text-yellow-600 mr-2" />
                            <span className="text-sm font-medium text-yellow-800">Medical Conditions:</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {currentPatient.patient.medical_conditions.map((condition, index) => (
                              <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button
                        onClick={() => setShowPrescriptionModal(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Prescription
                      </Button>
                      <Button
                        onClick={() => setShowAdmissionModal(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Bed className="h-4 w-4 mr-2" />
                        Suggest Admission
                      </Button>
                      <Button
                        onClick={() => setShowReferralModal(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Refer Department
                      </Button>
                      <Button
                        onClick={completeCurrentConsultation}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">No Current Patient</h4>
                    <p className="text-gray-600 mb-4">Call the next patient to start consultation</p>
                    <Button
                      onClick={handleCallNextPatient}
                      disabled={waitingPatients.length === 0}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Call Next Patient ({waitingPatients.length} waiting)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice Notes */}
            {currentPatient && activeConsultation && (
              <VoiceNoteRecorder
                consultationId={activeConsultation.id}
                doctorId={selectedDoctor}
                onNoteSaved={() => refetch()}
              />
            )}
          </div>

          {/* Waiting Queue */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Waiting Queue ({waitingPatients.length})
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {waitingPatients.map((visit, index) => (
                    <div key={visit.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold text-gray-900">#{visit.stn} {visit.patient?.name}</h5>
                          <p className="text-sm text-gray-600">
                            Age: {visit.patient?.age} • {formatTime(visit.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Position</div>
                          <div className="text-lg font-bold text-teal-600">#{index + 1}</div>
                        </div>
                      </div>
                      
                      {index === 0 && !currentPatient && (
                        <Button
                          onClick={() => handleCallNextPatient()}
                          size="sm"
                          className="w-full mt-2 bg-teal-600 hover:bg-teal-700"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Call This Patient
                        </Button>
                      )}
                    </div>
                  ))}

                  {waitingPatients.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p>No patients waiting</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Session Statistics</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session Started:</span>
                    <span className="font-medium">{formatTime(session?.started_at || '')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patients Seen:</span>
                    <span className="font-medium">{consultations.filter(c => c.status === 'completed').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">In Queue:</span>
                    <span className="font-medium">{waitingPatients.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session Status:</span>
                    <span className={`font-medium ${
                      session?.session_status === 'active' ? 'text-green-600' :
                      session?.session_status === 'break' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {session?.session_status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Prescription Modal */}
        <Modal
          isOpen={showPrescriptionModal}
          onClose={() => setShowPrescriptionModal(false)}
          title="Create Digital Prescription"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h4 className="font-semibold text-teal-900 mb-2">Patient: {currentPatient?.patient?.name}</h4>
              <p className="text-sm text-teal-800">Token #{currentPatient?.stn} • {currentPatient?.patient?.uid}</p>
            </div>

            <Input
              label="Diagnosis *"
              value={prescriptionData.diagnosis}
              onChange={(e) => setPrescriptionData(prev => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="Enter diagnosis"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prescription *
              </label>
              <textarea
                value={prescriptionData.prescription}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, prescription: e.target.value }))}
                placeholder="1. Medicine name - Dosage - Frequency - Duration&#10;2. Medicine name - Dosage - Frequency - Duration"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={prescriptionData.notes}
                onChange={(e) => setPrescriptionData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional instructions or notes"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <Input
              label="Follow-up in Days (0 = No follow-up)"
              type="number"
              value={prescriptionData.follow_up_days}
              onChange={(e) => setPrescriptionData(prev => ({ ...prev, follow_up_days: parseInt(e.target.value) || 0 }))}
              min="0"
              max="90"
              placeholder="7"
            />

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPrescriptionModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={savePrescription}
                loading={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Prescription
              </Button>
            </div>
          </div>
        </Modal>

        {/* Admission Suggestion Modal */}
        <Modal
          isOpen={showAdmissionModal}
          onClose={() => setShowAdmissionModal(false)}
          title="Suggest Patient Admission"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Patient: {currentPatient?.patient?.name}</h4>
              <p className="text-sm text-blue-800">This will send an admission request to the admin panel</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Admission Type *"
                value={admissionData.admission_type}
                onChange={(e) => setAdmissionData(prev => ({ ...prev, admission_type: e.target.value }))}
                options={[
                  { value: 'planned', label: 'Planned Admission' },
                  { value: 'emergency', label: 'Emergency Admission' },
                  { value: 'observation', label: 'Observation' },
                  { value: 'surgery', label: 'Surgery' }
                ]}
                required
              />

              <Select
                label="Preferred Ward *"
                value={admissionData.ward_type}
                onChange={(e) => setAdmissionData(prev => ({ ...prev, ward_type: e.target.value }))}
                options={[
                  { value: 'general', label: 'General Ward' },
                  { value: 'semi_private', label: 'Semi-Private' },
                  { value: 'private', label: 'Private Room' },
                  { value: 'icu', label: 'ICU' }
                ]}
                required
              />
            </div>

            <Input
              label="Estimated Duration (Days) *"
              type="number"
              value={admissionData.estimated_duration}
              onChange={(e) => setAdmissionData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 1 }))}
              min="1"
              max="30"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Admission *
              </label>
              <textarea
                value={admissionData.reason}
                onChange={(e) => setAdmissionData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Detailed medical reason for admission"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requirements
              </label>
              <textarea
                value={admissionData.special_requirements}
                onChange={(e) => setAdmissionData(prev => ({ ...prev, special_requirements: e.target.value }))}
                placeholder="Any special medical requirements or monitoring needed"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={2}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAdmissionModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={suggestAdmission}
                loading={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Admin
              </Button>
            </div>
          </div>
        </Modal>

        {/* Department Referral Modal */}
        <Modal
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          title="Refer to Another Department"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Patient: {currentPatient?.patient?.name}</h4>
              <p className="text-sm text-purple-800">Refer patient to another department for specialized care</p>
            </div>

            <Select
              label="Refer to Department *"
              value={referralData.department}
              onChange={(e) => setReferralData(prev => ({ ...prev, department: e.target.value }))}
              options={[
                { value: '', label: 'Select Department' },
                { value: 'cardiology', label: 'Cardiology' },
                { value: 'orthopedics', label: 'Orthopedics' },
                { value: 'pediatrics', label: 'Pediatrics' },
                { value: 'dermatology', label: 'Dermatology' },
                { value: 'neurology', label: 'Neurology' },
                { value: 'gynecology', label: 'Gynecology' }
              ]}
              required
            />

            <Select
              label="Urgency Level *"
              value={referralData.urgency}
              onChange={(e) => setReferralData(prev => ({ ...prev, urgency: e.target.value }))}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High Priority' },
                { value: 'urgent', label: 'Urgent' }
              ]}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Referral *
              </label>
              <textarea
                value={referralData.reason}
                onChange={(e) => setReferralData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Medical reason for referring to specialist"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={referralData.notes}
                onChange={(e) => setReferralData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional information for the specialist"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={2}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowReferralModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={sendReferral}
                loading={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Referral
              </Button>
            </div>
          </div>
        </Modal>

        {/* Nurse Call Modal */}
        <Modal
          isOpen={showNurseCallModal}
          onClose={() => setShowNurseCallModal(false)}
          title="Call Nurse Assistance"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Nurse Call Request
              </h4>
              <p className="text-sm text-yellow-800">This will notify nursing staff for immediate assistance</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Urgency Level *"
                value={nurseCallData.urgency}
                onChange={(e) => setNurseCallData(prev => ({ ...prev, urgency: e.target.value }))}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'high', label: 'High Priority' },
                  { value: 'urgent', label: 'Urgent/Emergency' }
                ]}
                required
              />

              <Input
                label="Room/Location"
                value={nurseCallData.room_number || roomName}
                onChange={(e) => setNurseCallData(prev => ({ ...prev, room_number: e.target.value }))}
                placeholder="Room number or location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Assistance *
              </label>
              <textarea
                value={nurseCallData.reason}
                onChange={(e) => setNurseCallData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="What assistance is needed?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                value={nurseCallData.special_instructions}
                onChange={(e) => setNurseCallData(prev => ({ ...prev, special_instructions: e.target.value }))}
                placeholder="Any special instructions for the nurse"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={2}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowNurseCallModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={callNurse}
                loading={loading}
                className={`flex-1 ${
                  nurseCallData.urgency === 'urgent' ? 'bg-red-600 hover:bg-red-700' :
                  nurseCallData.urgency === 'high' ? 'bg-orange-600 hover:bg-orange-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Bell className="h-4 w-4 mr-2" />
                Call Nurse
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
};