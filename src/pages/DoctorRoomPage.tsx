import React, { useState, useEffect } from 'react';
import { 
  Brain,
  Stethoscope, 
  Users, 
  Clock, 
  Mic, 
  MicOff, 
  RefreshCw, 
  User,
  FileText,
  Save,
  Printer,
  Plus,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Activity,
  Heart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Volume2,
  VolumeX,
  Settings,
  LogOut,
  Sparkles,
  Zap,
  Award,
  Target,
  TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { VoiceNoteRecorder } from '../components/VoiceNoteRecorder';
import { useDoctorSession } from '../hooks/useDoctorSession';
import { useAuth } from '../hooks/useAuth';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { supabase } from '../lib/supabase';
import { formatTime, formatDate } from '../lib/utils';
import { Doctor, Visit, Consultation, ConsultationNote } from '../types';

export const DoctorRoomPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [roomName, setRoomName] = useState('');
  const [showStartModal, setShowStartModal] = useState(true);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [currentPrescription, setCurrentPrescription] = useState({
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    diagnosis: '',
    symptoms: '',
    notes: '',
    followUpDate: '',
    tests: ''
  });
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTranscript, setRecordingTranscript] = useState('');

  // Real-time updates
  useRealTimeUpdates(() => {
    refetch();
  });

  // Enhanced state for better UX
  const [sessionStats, setSessionStats] = useState({
    totalPatients: 0,
    avgConsultationTime: 0,
    patientSatisfaction: 0,
    efficiency: 0
  });

  const {
    session,
    consultations,
    waitingPatients,
    currentPatient,
    loading,
    error,
    startSession,
    endSession,
    updateSessionStatus,
    startConsultation,
    completeConsultation,
    callNextPatient,
    refetch
  } = useDoctorSession(selectedDoctorId);

  // Voice recognition for prescription dictation
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: voiceSupported
  } = useVoiceRecognition({
    continuous: true,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal) {
        setRecordingTranscript(prev => prev + ' ' + text);
      }
    }
  });

  // Text-to-speech for announcements
  const speak = (text: string) => {
    if (!speakerEnabled || !('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    speechSynthesis.speak(utterance);
  };

  // Auto refresh functionality
  useEffect(() => {
    if (!autoRefresh || !session) return;

    const interval = setInterval(() => {
      refetch();
      setLastRefresh(new Date());
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, session, refetch]);

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
    if (session) {
      calculateSessionStats();
    }
  }, []);

  // Calculate session statistics
  const calculateSessionStats = () => {
    const completedConsultations = consultations.filter(c => c.status === 'completed');
    const totalTime = completedConsultations.reduce((sum, c) => sum + (c.duration_minutes || 0), 0);
    
    setSessionStats({
      totalPatients: consultations.length,
      avgConsultationTime: completedConsultations.length > 0 ? totalTime / completedConsultations.length : 0,
      patientSatisfaction: 4.2, // Mock data - would come from feedback
      efficiency: consultations.length > 0 ? (completedConsultations.length / consultations.length) * 100 : 0
    });
  };

  useEffect(() => {
    calculateSessionStats();
  }, [consultations]);

  // Announce new patients
  useEffect(() => {
    if (waitingPatients.length > 0 && speakerEnabled) {
      const patientCount = waitingPatients.length;
      speak(`${patientCount} patient${patientCount > 1 ? 's' : ''} waiting in queue`);
    }
  }, [waitingPatients.length, speakerEnabled]);

  const fetchDoctors = async () => {
    try {
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

  const handleStartSession = async () => {
    if (!selectedDoctorId || !roomName.trim()) {
      alert('Please select a doctor and enter room name');
      return;
    }

    const newSession = await startSession(roomName.trim());
    if (newSession) {
      setShowStartModal(false);
      speak(`Session started for room ${roomName}`);
    }
  };

  const handleEndSession = async () => {
    if (confirm('Are you sure you want to end this session?')) {
      await endSession();
      setShowStartModal(true);
      speak('Session ended');
    }
  };

  const handleCallNext = async () => {
    const consultation = await callNextPatient();
    if (consultation) {
      speak(`Next patient called. Token number ${consultation.visit?.stn}`);
    }
  };

  const handleCompleteConsultation = async (consultationId: string) => {
    await completeConsultation(consultationId);
    speak('Consultation completed');
  };

  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
    speak('Data refreshed');
  };

  const toggleRecording = () => {
    if (isListening) {
      stopListening();
      setIsRecording(false);
    } else {
      startListening();
      setIsRecording(true);
      resetTranscript();
      setRecordingTranscript('');
    }
  };

  const addMedicine = () => {
    setCurrentPrescription(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }));
  };

  const removeMedicine = (index: number) => {
    setCurrentPrescription(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    setCurrentPrescription(prev => ({
      ...prev,
      medicines: prev.medicines.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const savePrescription = async () => {
    if (!currentPatient) return;

    try {
      const prescriptionText = `
DIAGNOSIS: ${currentPrescription.diagnosis}
SYMPTOMS: ${currentPrescription.symptoms}

PRESCRIPTION:
${currentPrescription.medicines.map((med, index) => 
  `${index + 1}. ${med.name} - ${med.dosage}
   Frequency: ${med.frequency}
   Duration: ${med.duration}
   Instructions: ${med.instructions}`
).join('\n\n')}

TESTS RECOMMENDED: ${currentPrescription.tests}
NOTES: ${currentPrescription.notes}
FOLLOW-UP: ${currentPrescription.followUpDate}
      `.trim();

      // Save to medical history
      const { error } = await supabase
        .from('medical_history')
        .insert({
          patient_uid: currentPatient.patient?.uid,
          visit_id: currentPatient.id,
          doctor_id: selectedDoctorId,
          diagnosis: currentPrescription.diagnosis,
          prescription: prescriptionText,
          notes: currentPrescription.notes
        });

      if (error) throw error;

      // Reset form
      setCurrentPrescription({
        medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        diagnosis: '',
        symptoms: '',
        notes: '',
        followUpDate: '',
        tests: ''
      });

      setShowPrescriptionModal(false);
      speak('Prescription saved successfully');
      alert('Prescription saved successfully!');
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Failed to save prescription');
    }
  };

  const printPrescription = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0;">MediQueue Clinic</h1>
          <p style="margin: 5px 0;">Digital Prescription</p>
          <p style="margin: 5px 0;">Date: ${formatDate(new Date().toISOString())}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Patient Information</h3>
          <p><strong>Name:</strong> ${currentPatient?.patient?.name}</p>
          <p><strong>Age:</strong> ${currentPatient?.patient?.age}</p>
          <p><strong>Phone:</strong> ${currentPatient?.patient?.phone}</p>
          <p><strong>Token:</strong> #${currentPatient?.stn}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Diagnosis</h3>
          <p>${currentPrescription.diagnosis}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Symptoms</h3>
          <p>${currentPrescription.symptoms}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Prescription</h3>
          ${currentPrescription.medicines.map((med, index) => `
            <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px;">
              <p><strong>${index + 1}. ${med.name}</strong></p>
              <p>Dosage: ${med.dosage}</p>
              <p>Frequency: ${med.frequency}</p>
              <p>Duration: ${med.duration}</p>
              <p>Instructions: ${med.instructions}</p>
            </div>
          `).join('')}
        </div>

        ${currentPrescription.tests && `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Recommended Tests</h3>
            <p>${currentPrescription.tests}</p>
          </div>
        `}

        ${currentPrescription.notes && `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Additional Notes</h3>
            <p>${currentPrescription.notes}</p>
          </div>
        `}

        ${currentPrescription.followUpDate && `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Follow-up</h3>
            <p>Next visit: ${currentPrescription.followUpDate}</p>
          </div>
        `}

        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #ccc; padding-top: 20px;">
          <p style="margin: 0;"><strong>Dr. ${doctors.find(d => d.id === selectedDoctorId)?.name}</strong></p>
          <p style="margin: 5px 0;">${doctors.find(d => d.id === selectedDoctorId)?.qualification}</p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">This is a digitally generated prescription</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Prescription - ${currentPatient?.patient?.name}</title>
            <style>
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent}
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">Print</button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Login check
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Stethoscope className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-4">Doctor Room Access</h2>
            <p className="text-gray-600 mb-4">Please sign in to access the doctor room</p>
            <Button onClick={() => window.location.href = '/admin'}>
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Doctor Console</h1>
                  <p className="text-xs text-gray-500">Advanced Consultation Platform</p>
                </div>
              </div>
              {session && (
                <div className="ml-4 flex items-center space-x-2">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {session.room_name}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    session.session_status === 'active' ? 'bg-green-100 text-green-800' :
                    session.session_status === 'break' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {session.session_status.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {/* Speaker Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSpeakerEnabled(!speakerEnabled);
                  speak(speakerEnabled ? 'Speaker disabled' : 'Speaker enabled');
                }}
                className={speakerEnabled ? 'bg-green-50 border-green-200' : ''}
              >
                {speakerEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>

              {/* Auto Refresh Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="auto-refresh" className="text-sm text-gray-600">
                  Auto ({refreshInterval}s)
                </label>
              </div>

              {/* Manual Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              <span className="text-xs text-gray-500">
                Last: {formatTime(lastRefresh.toISOString())}
              </span>

              {session && (
                <Button variant="outline" onClick={handleEndSession} size="sm">
                  End Session
                </Button>
              )}

              <Button variant="outline" onClick={() => signOut()} size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {!session ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Stethoscope className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Active Session</h2>
            <p className="text-gray-600 mb-6">Start a new session to begin consultations</p>
            <Button onClick={() => setShowStartModal(true)} size="lg" className="px-8">
              <Sparkles className="h-5 w-5 mr-2" />
              Start New Session
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enhanced Session Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                      <Users className="h-8 w-8" />
                    </div>
                    <div className="ml-4">
                      <p className="text-blue-100 text-sm font-medium">Waiting</p>
                      <p className="text-3xl font-bold">{waitingPatients.length}</p>
                      <p className="text-blue-100 text-xs">Patients in queue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <div className="ml-4">
                      <p className="text-green-100 text-sm font-medium">Completed</p>
                      <p className="text-3xl font-bold">
                        {consultations.filter(c => c.status === 'completed').length}
                      </p>
                      <p className="text-green-100 text-xs">Consultations done</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                      <Clock className="h-8 w-8" />
                    </div>
                    <div className="ml-4">
                      <p className="text-purple-100 text-sm font-medium">Avg Time</p>
                      <p className="text-3xl font-bold">
                        {sessionStats.avgConsultationTime.toFixed(0)}m
                      </p>
                      <p className="text-purple-100 text-xs">Per consultation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                      <TrendingUp className="h-8 w-8" />
                    </div>
                    <div className="ml-4">
                      <p className="text-orange-100 text-sm font-medium">Efficiency</p>
                      <p className="text-3xl font-bold">
                        {sessionStats.efficiency.toFixed(0)}%
                      </p>
                      <p className="text-orange-100 text-xs">Completion rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Session Overview */}
            <Card className="shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-500" />
                    Session Overview
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Started: {formatTime(session.started_at)}</span>
                    </div>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      <span>Duration: {Math.floor((Date.now() - new Date(session.started_at).getTime()) / (1000 * 60))}m</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{sessionStats.totalPatients}</div>
                    <div className="text-sm text-blue-700">Total Patients</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{sessionStats.avgConsultationTime.toFixed(0)}m</div>
                    <div className="text-sm text-green-700">Avg Consultation</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{sessionStats.patientSatisfaction.toFixed(1)}/5</div>
                    <div className="text-sm text-purple-700">Satisfaction</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{sessionStats.efficiency.toFixed(0)}%</div>
                    <div className="text-sm text-orange-700">Efficiency</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Time Display */}
            <div className="hidden">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Session Time</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.floor((Date.now() - new Date(session.started_at).getTime()) / (1000 * 60))}m
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Patient */}
            {currentPatient && (
              <Card className="border-l-4 border-green-500 shadow-xl bg-gradient-to-r from-green-50 to-green-100">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-green-800 flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Current Patient
                    </h3>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setShowPrescriptionModal(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Write Prescription
                      </Button>
                      <Button
                        onClick={() => handleCompleteConsultation(
                          consultations.find(c => c.visit_id === currentPatient.id)?.id || ''
                        )}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Patient Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{currentPatient.patient?.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{currentPatient.patient?.age} years old</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{currentPatient.patient?.phone}</span>
                        </div>
                        {currentPatient.patient?.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{currentPatient.patient.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Health Information</h4>
                      {currentPatient.patient?.blood_group && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-sm bg-red-100 text-red-800">
                            <Heart className="h-3 w-3 mr-1" />
                            {currentPatient.patient.blood_group}
                          </span>
                        </div>
                      )}
                      
                      {currentPatient.patient?.allergies && currentPatient.patient.allergies.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center mb-1">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-1" />
                            <span className="text-sm font-medium text-yellow-800">Allergies:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {currentPatient.patient.allergies.map((allergy, index) => (
                              <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                {allergy}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentPatient.patient?.medical_conditions && currentPatient.patient.medical_conditions.length > 0 && (
                        <div>
                          <div className="flex items-center mb-1">
                            <Activity className="h-4 w-4 text-blue-600 mr-1" />
                            <span className="text-sm font-medium text-blue-800">Conditions:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {currentPatient.patient.medical_conditions.map((condition, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Queue and Voice Notes */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Waiting Queue */}
              <Card className="shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-500" />
                      Waiting Queue ({waitingPatients.length})
                    </h3>
                    <Button
                      onClick={handleCallNext}
                      disabled={waitingPatients.length === 0 || !!currentPatient}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Call Next
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {waitingPatients.map((patient, index) => (
                      <div key={patient.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                        <div>
                          <div className="font-semibold text-gray-900">
                            #{patient.stn} - {patient.patient?.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            Age: {patient.patient?.age} | {patient.department}
                          </div>
                          <div className="text-xs text-gray-500">
                            Waiting: {Math.floor((Date.now() - new Date(patient.created_at).getTime()) / (1000 * 60))}m
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-blue-600 mb-2">
                            Position: {index + 1}
                          </div>
                          <Button
                            size="sm" 
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                            onClick={() => startConsultation(patient.id)}
                            disabled={!!currentPatient}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        </div>
                      </div>
                    ))}

                    {waitingPatients.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="h-8 w-8 text-gray-300" />
                        </div>
                        <p>No patients waiting</p>
                        <p className="text-sm mt-2">Patients will appear here as they check in</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Voice Notes */}
              {selectedDoctorId && (
                <VoiceNoteRecorder
                  consultationId={consultations.find(c => c.status === 'in_progress')?.id || ''}
                  doctorId={selectedDoctorId}
                  onNoteSaved={() => speak('Voice note saved')}
                />
              )}
            </div>

            {/* Recent Consultations */}
            <Card className="shadow-xl">
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-500" />
                  Today's Consultations ({consultations.length})
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {consultations.map((consultation) => (
                    <div key={consultation.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50">
                      <div>
                        <div className="font-medium text-gray-900">
                          {consultation.patient?.name} - Token #{consultation.visit?.stn}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTime(consultation.started_at)}
                          {consultation.completed_at && ` - ${formatTime(consultation.completed_at)}`}
                          {consultation.duration_minutes && ` (${consultation.duration_minutes}m)`}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        consultation.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {consultation.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  ))}

                  {consultations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-gray-300" />
                      </div>
                      <p>No consultations today</p>
                      <p className="text-sm mt-2">Completed consultations will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Start Session Modal */}
      <Modal
        isOpen={showStartModal}
        onClose={() => {}}
        title="🚀 Start Advanced Doctor Session"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Select Doctor"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            options={[
              { value: '', label: 'Select a doctor' },
              ...doctors.map(doctor => ({
                value: doctor.id,
                label: `${doctor.name} - ${doctor.specialization}`
              }))
            ]}
            required
          />

          <Input
            label="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g., Room 101, Consultation Room A"
            required
          />

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Session Features:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Voice announcements for new patients</li>
              <li>• Auto-refresh patient queue</li>
              <li>• Digital prescription writing</li>
              <li>• Voice note recording</li>
              <li>• Real-time patient management</li>
            </ul>
          </div>

          <Button
            onClick={handleStartSession}
            disabled={!selectedDoctorId || !roomName.trim()}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Start Session
          </Button>
        </div>
      </Modal>

      {/* Digital Prescription Modal */}
      <Modal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        title="📋 Digital Prescription System"
        size="xl"
      >
        <div className="space-y-6">
          {currentPatient && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Patient: {currentPatient.patient?.name}</h4>
              <p className="text-sm text-blue-800">
                Age: {currentPatient.patient?.age} | Token: #{currentPatient.stn} | 
                Phone: {currentPatient.patient?.phone}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Diagnosis"
              value={currentPrescription.diagnosis}
              onChange={(e) => setCurrentPrescription(prev => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="Primary diagnosis"
            />

            <Input
              label="Symptoms"
              value={currentPrescription.symptoms}
              onChange={(e) => setCurrentPrescription(prev => ({ ...prev, symptoms: e.target.value }))}
              placeholder="Patient symptoms"
            />
          </div>

          {/* Voice Recording for Prescription */}
          {voiceSupported && (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center">
                    <Brain className="h-4 w-4 mr-2 text-purple-600" />
                    AI Voice Dictation
                  </h4>
                  <Button
                    onClick={toggleRecording}
                    variant={isRecording ? 'danger' : 'outline'}
                    size="sm"
                  >
                    {isRecording ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="min-h-[80px] p-4 border border-purple-300 rounded-lg bg-white shadow-sm">
                  <p className="text-sm text-gray-900">
                    {recordingTranscript || interimTranscript || 'Click "Start Recording" to dictate prescription...'}
                  </p>
                </div>
                {recordingTranscript && (
                  <div className="mt-2 flex space-x-2">
                    <Button
                      size="sm" 
                      className="bg-blue-500 hover:bg-blue-600"
                      onClick={() => {
                        setCurrentPrescription(prev => ({
                          ...prev,
                          diagnosis: prev.diagnosis + ' ' + recordingTranscript
                        }));
                        setRecordingTranscript('');
                      }}
                    >
                      Add to Diagnosis
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => {
                        setCurrentPrescription(prev => ({
                          ...prev,
                          notes: prev.notes + ' ' + recordingTranscript
                        }));
                        setRecordingTranscript('');
                      }}
                    >
                      Add to Notes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Plus className="h-4 w-4 mr-2 text-green-500" />
                Prescription Medicines
              </h4>
              <Button onClick={addMedicine} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine
              </Button>
            </div>

            <div className="space-y-4">
              {currentPrescription.medicines.map((medicine, index) => (
                <Card key={index} className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-4">
                      <h5 className="font-medium text-gray-900 flex items-center">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                        </div>
                        Medicine {index + 1}
                      </h5>
                      {currentPrescription.medicines.length > 1 && (
                        <Button
                          onClick={() => removeMedicine(index)}
                          variant="danger"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        label="Medicine Name"
                        value={medicine.name}
                        onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                        placeholder="e.g., Paracetamol"
                      />

                      <Input
                        label="Dosage"
                        value={medicine.dosage}
                        onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg"
                      />

                      <Input
                        label="Frequency"
                        value={medicine.frequency}
                        onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                        placeholder="e.g., Twice daily"
                      />

                      <Input
                        label="Duration"
                        value={medicine.duration}
                        onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                        placeholder="e.g., 5 days"
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions
                      </label>
                      <textarea
                        value={medicine.instructions}
                        onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                        placeholder="e.g., Take after meals"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Additional Fields */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recommended Tests
              </label>
              <textarea
                value={currentPrescription.tests}
                onChange={(e) => setCurrentPrescription(prev => ({ ...prev, tests: e.target.value }))}
                placeholder="Blood test, X-ray, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={currentPrescription.notes}
                onChange={(e) => setCurrentPrescription(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional instructions or notes"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>

          <Input
            label="Follow-up Date (Optional)"
            type="date"
            value={currentPrescription.followUpDate}
            onChange={(e) => setCurrentPrescription(prev => ({ ...prev, followUpDate: e.target.value }))}
          />

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowPrescriptionModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={printPrescription}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Preview
            </Button>
            <Button
              onClick={savePrescription}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Prescription
            </Button>
          </div>
        </div>
      </Modal>

      {/* Credits Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-600">
            <p>
              Developed by{' '}
              <a 
                href="https://instagram.com/aftabxplained" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                Aftab Alam [ASOSE Lajpat Nagar]
              </a>
              {' '}| Follow on Instagram:{' '}
              <a 
                href="https://instagram.com/aftabxplained" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                @aftabxplained
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};