import React, { useState, useEffect } from 'react';
import { 
  Bed, 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Settings,
  Wrench,
  UserX,
  UserCheck,
  Calendar,
  DollarSign,
  Activity,
  Wifi,
  Tv,
  Car,
  Coffee,
  Shield,
  Thermometer
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Modal } from './ui/Modal';
import { supabase } from '../lib/supabase';
import { formatDate, formatTime } from '../lib/utils';

interface RoomManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Room {
  id: string;
  room_number: string;
  room_type: 'general' | 'private' | 'icu' | 'semi_private' | 'emergency' | 'operation';
  floor_number: number;
  bed_count: number;
  daily_rate: number;
  amenities: string[];
  current_patient_id?: string;
  current_patient?: any;
  maintenance_status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';
  last_cleaned: string;
  next_maintenance: string;
  room_capacity: number;
  equipment: string[];
  created_at: string;
  updated_at: string;
}

export const RoomManagement: React.FC<RoomManagementProps> = ({ isOpen, onClose }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
      fetchAvailablePatients();
    }
  }, [isOpen]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      // Demo rooms data
      const demoRooms: Room[] = [
        {
          id: 'R101',
          room_number: '101',
          room_type: 'general',
          floor_number: 1,
          bed_count: 4,
          daily_rate: 1500,
          amenities: ['AC', 'TV', 'Attached Bathroom', 'WiFi'],
          maintenance_status: 'available',
          last_cleaned: new Date().toISOString(),
          next_maintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          room_capacity: 4,
          equipment: ['Oxygen Supply', 'Nurse Call Button', 'Emergency Light'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'R201',
          room_number: '201',
          room_type: 'private',
          floor_number: 2,
          bed_count: 1,
          daily_rate: 3000,
          amenities: ['AC', 'TV', 'Attached Bathroom', 'WiFi', 'Refrigerator', 'Sofa', 'Dining Table'],
          current_patient_id: 'patient-1',
          current_patient: { name: 'John Doe', uid: 'CLN1-ABC123', admission_date: new Date().toISOString() },
          maintenance_status: 'occupied',
          last_cleaned: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          next_maintenance: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          room_capacity: 1,
          equipment: ['Oxygen Supply', 'Nurse Call Button', 'Emergency Light', 'Cardiac Monitor'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'ICU1',
          room_number: 'ICU-1',
          room_type: 'icu',
          floor_number: 4,
          bed_count: 1,
          daily_rate: 5000,
          amenities: ['Central AC', 'Ventilator', 'Cardiac Monitor', 'Defibrillator', 'Emergency Power'],
          maintenance_status: 'maintenance',
          last_cleaned: new Date().toISOString(),
          next_maintenance: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          room_capacity: 1,
          equipment: ['Ventilator', 'Cardiac Monitor', 'Defibrillator', 'Oxygen Supply', 'Suction Machine', 'IV Pump'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'R301',
          room_number: '301',
          room_type: 'semi_private',
          floor_number: 3,
          bed_count: 2,
          daily_rate: 2000,
          amenities: ['AC', 'TV', 'Attached Bathroom', 'WiFi', 'Visitor Chair'],
          maintenance_status: 'cleaning',
          last_cleaned: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          next_maintenance: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          room_capacity: 2,
          equipment: ['Oxygen Supply', 'Nurse Call Button', 'Emergency Light'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'ER1',
          room_number: 'ER-1',
          room_type: 'emergency',
          floor_number: 1,
          bed_count: 1,
          daily_rate: 2500,
          amenities: ['Emergency Equipment', 'Crash Cart', 'Defibrillator', 'Oxygen'],
          maintenance_status: 'available',
          last_cleaned: new Date().toISOString(),
          next_maintenance: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          room_capacity: 1,
          equipment: ['Crash Cart', 'Defibrillator', 'Oxygen Supply', 'IV Pump', 'Emergency Medications'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'OT1',
          room_number: 'OT-1',
          room_type: 'operation',
          floor_number: 3,
          bed_count: 1,
          daily_rate: 8000,
          amenities: ['Sterile Environment', 'Operation Lights', 'Anesthesia Machine', 'Surgical Equipment'],
          maintenance_status: 'reserved',
          last_cleaned: new Date().toISOString(),
          next_maintenance: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          room_capacity: 1,
          equipment: ['Operation Table', 'Anesthesia Machine', 'Surgical Lights', 'Electrocautery', 'Suction Machine'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setRooms(demoRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePatients = async () => {
    try {
      // Demo patients waiting for admission
      const demoPatients = [
        {
          id: 'patient-1',
          uid: 'CLN1-ABC123',
          name: 'John Doe',
          age: 35,
          phone: '+91-9876543210',
          admission_status: 'approved',
          admission_type: 'planned',
          ward_preference: 'private'
        },
        {
          id: 'patient-2',
          uid: 'CLN1-XYZ789',
          name: 'Jane Smith',
          age: 28,
          phone: '+91-9876543211',
          admission_status: 'approved',
          admission_type: 'emergency',
          ward_preference: 'icu'
        }
      ];
      
      setPatients(demoPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const saveRoom = async () => {
    if (!editingRoom?.room_number || !editingRoom?.room_type) {
      setError('Room number and type are required');
      return;
    }

    setLoading(true);
    try {
      const roomData: Room = {
        id: editingRoom.id || `R${Date.now()}`,
        room_number: editingRoom.room_number,
        room_type: editingRoom.room_type,
        floor_number: editingRoom.floor_number || 1,
        bed_count: editingRoom.bed_count || 1,
        daily_rate: editingRoom.daily_rate || 1500,
        amenities: editingRoom.amenities || [],
        maintenance_status: editingRoom.maintenance_status || 'available',
        last_cleaned: editingRoom.last_cleaned || new Date().toISOString(),
        next_maintenance: editingRoom.next_maintenance || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        room_capacity: editingRoom.room_capacity || editingRoom.bed_count || 1,
        equipment: editingRoom.equipment || [],
        created_at: editingRoom.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingRoom.id) {
        setRooms(prev => prev.map(r => r.id === roomData.id ? roomData : r));
      } else {
        setRooms(prev => [roomData, ...prev]);
      }

      setShowEditModal(false);
      setEditingRoom(null);
      setError('');
    } catch (error) {
      console.error('Error saving room:', error);
      setError('Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  const assignPatientToRoom = async () => {
    if (!selectedRoom || !selectedPatient) {
      setError('Please select both room and patient');
      return;
    }

    setLoading(true);
    try {
      const patient = patients.find(p => p.id === selectedPatient);
      
      setRooms(prev => prev.map(room => 
        room.id === selectedRoom.id 
          ? { 
              ...room, 
              maintenance_status: 'occupied' as const, 
              current_patient_id: selectedPatient,
              current_patient: { 
                ...patient, 
                admission_date: new Date().toISOString() 
              }
            }
          : room
      ));

      setPatients(prev => prev.filter(p => p.id !== selectedPatient));
      setShowAssignModal(false);
      setSelectedRoom(null);
      setSelectedPatient('');
      setError('');
    } catch (error) {
      console.error('Error assigning patient:', error);
      setError('Failed to assign patient');
    } finally {
      setLoading(false);
    }
  };

  const updateRoomStatus = async (roomId: string, status: Room['maintenance_status']) => {
    setLoading(true);
    try {
      setRooms(prev => prev.map(room => 
        room.id === roomId 
          ? { 
              ...room, 
              maintenance_status: status,
              last_cleaned: status === 'available' ? new Date().toISOString() : room.last_cleaned,
              current_patient_id: status === 'available' ? undefined : room.current_patient_id,
              current_patient: status === 'available' ? undefined : room.current_patient
            }
          : room
      ));
      setError('');
    } catch (error) {
      console.error('Error updating room status:', error);
      setError('Failed to update room status');
    } finally {
      setLoading(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    setLoading(true);
    try {
      setRooms(prev => prev.filter(r => r.id !== roomId));
      setError('');
    } catch (error) {
      console.error('Error deleting room:', error);
      setError('Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  const getAmenityIcon = (amenity: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'AC': <Thermometer className="h-4 w-4" />,
      'TV': <Tv className="h-4 w-4" />,
      'WiFi': <Wifi className="h-4 w-4" />,
      'Parking': <Car className="h-4 w-4" />,
      'Cafeteria': <Coffee className="h-4 w-4" />,
      'Security': <Shield className="h-4 w-4" />
    };
    return icons[amenity] || <Activity className="h-4 w-4" />;
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = !searchQuery || 
      room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.room_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.current_patient?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = !filterType || room.room_type === filterType;
    const matchesStatus = !filterStatus || room.maintenance_status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const roomStats = {
    total: rooms.length,
    available: rooms.filter(r => r.maintenance_status === 'available').length,
    occupied: rooms.filter(r => r.maintenance_status === 'occupied').length,
    maintenance: rooms.filter(r => r.maintenance_status === 'maintenance').length,
    occupancy: rooms.length > 0 ? Math.round((rooms.filter(r => r.maintenance_status === 'occupied').length / rooms.length) * 100) : 0
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Room Management System" size="xl">
      <div className="space-y-6">
        {/* Room Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <Building2 className="h-6 w-6 text-teal-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">{roomStats.total}</div>
              <div className="text-sm text-gray-600">Total Rooms</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">{roomStats.available}</div>
              <div className="text-sm text-gray-600">Available</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Users className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">{roomStats.occupied}</div>
              <div className="text-sm text-gray-600">Occupied</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Wrench className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">{roomStats.maintenance}</div>
              <div className="text-sm text-gray-600">Maintenance</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Activity className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">{roomStats.occupancy}%</div>
              <div className="text-sm text-gray-600">Occupancy</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-3">
            <Input
              placeholder="Search rooms, patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: '', label: 'All Types' },
                { value: 'general', label: 'General Ward' },
                { value: 'private', label: 'Private Room' },
                { value: 'semi_private', label: 'Semi-Private' },
                { value: 'icu', label: 'ICU' },
                { value: 'emergency', label: 'Emergency' },
                { value: 'operation', label: 'Operation Theater' }
              ]}
            />
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'available', label: 'Available' },
                { value: 'occupied', label: 'Occupied' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'cleaning', label: 'Cleaning' },
                { value: 'reserved', label: 'Reserved' }
              ]}
            />
          </div>
          <Button onClick={() => {
            setEditingRoom({
              room_number: '',
              room_type: 'general',
              floor_number: 1,
              bed_count: 1,
              daily_rate: 1500,
              amenities: [],
              equipment: [],
              maintenance_status: 'available',
              room_capacity: 1
            });
            setShowEditModal(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto">
          {filteredRooms.map((room) => (
            <Card key={room.id} className={`border-2 transition-all hover:shadow-lg ${
              room.maintenance_status === 'available' ? 'border-green-200 bg-green-50' :
              room.maintenance_status === 'occupied' ? 'border-red-200 bg-red-50' :
              room.maintenance_status === 'maintenance' ? 'border-yellow-200 bg-yellow-50' :
              room.maintenance_status === 'cleaning' ? 'border-blue-200 bg-blue-50' :
              'border-purple-200 bg-purple-50'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      Room {room.room_number}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Floor {room.floor_number} • {room.bed_count} bed{room.bed_count > 1 ? 's' : ''} • {room.room_type.replace('_', ' ')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    room.maintenance_status === 'available' ? 'bg-green-100 text-green-800' :
                    room.maintenance_status === 'occupied' ? 'bg-red-100 text-red-800' :
                    room.maintenance_status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    room.maintenance_status === 'cleaning' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {room.maintenance_status.toUpperCase()}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Current Patient */}
                {room.current_patient && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <h5 className="font-semibold text-gray-900 mb-1 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Current Patient
                    </h5>
                    <p className="text-sm text-gray-700">{room.current_patient.name}</p>
                    <p className="text-xs text-gray-500">{room.current_patient.uid}</p>
                    <p className="text-xs text-gray-500">
                      Admitted: {formatDate(room.current_patient.admission_date)}
                    </p>
                  </div>
                )}

                {/* Room Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Rate:</span>
                    <span className="font-medium text-teal-600">₹{room.daily_rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{room.room_capacity} patient{room.room_capacity > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Cleaned:</span>
                    <span className="font-medium">{formatTime(room.last_cleaned)}</span>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h6 className="text-xs font-semibold text-gray-700 mb-2">Amenities:</h6>
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.slice(0, 4).map((amenity, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs">
                        {getAmenityIcon(amenity)}
                        <span className="ml-1">{amenity}</span>
                      </span>
                    ))}
                    {room.amenities.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        +{room.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <h6 className="text-xs font-semibold text-gray-700 mb-2">Equipment:</h6>
                  <div className="flex flex-wrap gap-1">
                    {room.equipment.slice(0, 3).map((equipment, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {equipment}
                      </span>
                    ))}
                    {room.equipment.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        +{room.equipment.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  {room.maintenance_status === 'available' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRoom(room);
                        setShowAssignModal(true);
                      }}
                      className="flex-1"
                      disabled={patients.length === 0}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  )}
                  
                  {room.maintenance_status === 'occupied' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateRoomStatus(room.id, 'cleaning')}
                      className="flex-1"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Discharge
                    </Button>
                  )}
                  
                  {room.maintenance_status === 'cleaning' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateRoomStatus(room.id, 'available')}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Clean Done
                    </Button>
                  )}
                  
                  {room.maintenance_status === 'maintenance' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateRoomStatus(room.id, 'available')}
                      className="flex-1"
                    >
                      <Wrench className="h-4 w-4 mr-1" />
                      Fix Done
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingRoom(room);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteRoom(room.id)}
                    disabled={room.maintenance_status === 'occupied'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Rooms Found</h3>
            <p className="text-gray-600 mb-4">Add your first room to get started with room management</p>
            <Button onClick={() => {
              setEditingRoom({
                room_number: '',
                room_type: 'general',
                floor_number: 1,
                bed_count: 1,
                daily_rate: 1500,
                amenities: [],
                equipment: [],
                maintenance_status: 'available',
                room_capacity: 1
              });
              setShowEditModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Room
            </Button>
          </div>
        )}

        {/* Room Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingRoom(null);
            setError('');
          }}
          title={`${editingRoom?.id ? 'Edit' : 'Add'} Room`}
          size="lg"
        >
          {editingRoom && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Room Number *"
                  value={editingRoom.room_number || ''}
                  onChange={(e) => setEditingRoom(prev => ({ ...prev!, room_number: e.target.value }))}
                  placeholder="e.g., 101, ICU-1"
                  required
                />
                <Select
                  label="Room Type *"
                  value={editingRoom.room_type || 'general'}
                  onChange={(e) => setEditingRoom(prev => ({ ...prev!, room_type: e.target.value as any }))}
                  options={[
                    { value: 'general', label: 'General Ward' },
                    { value: 'private', label: 'Private Room' },
                    { value: 'semi_private', label: 'Semi-Private' },
                    { value: 'icu', label: 'ICU' },
                    { value: 'emergency', label: 'Emergency Room' },
                    { value: 'operation', label: 'Operation Theater' }
                  ]}
                  required
                />
                <Input
                  label="Floor Number *"
                  type="number"
                  value={editingRoom.floor_number || ''}
                  onChange={(e) => setEditingRoom(prev => ({ ...prev!, floor_number: parseInt(e.target.value) || 1 }))}
                  min="1"
                  max="10"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Bed Count *"
                  type="number"
                  value={editingRoom.bed_count || ''}
                  onChange={(e) => setEditingRoom(prev => ({ ...prev!, bed_count: parseInt(e.target.value) || 1 }))}
                  min="1"
                  max="10"
                  required
                />
                <Input
                  label="Daily Rate (₹) *"
                  type="number"
                  value={editingRoom.daily_rate || ''}
                  onChange={(e) => setEditingRoom(prev => ({ ...prev!, daily_rate: parseFloat(e.target.value) || 1500 }))}
                  min="0"
                  required
                />
                <Input
                  label="Room Capacity *"
                  type="number"
                  value={editingRoom.room_capacity || ''}
                  onChange={(e) => setEditingRoom(prev => ({ ...prev!, room_capacity: parseInt(e.target.value) || 1 }))}
                  min="1"
                  max="10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenities (Select multiple)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['AC', 'TV', 'WiFi', 'Attached Bathroom', 'Refrigerator', 'Sofa', 'Dining Table', 'Visitor Chair', 'Balcony'].map(amenity => (
                    <label key={amenity} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingRoom.amenities?.includes(amenity) || false}
                        onChange={(e) => {
                          const amenities = editingRoom.amenities || [];
                          if (e.target.checked) {
                            setEditingRoom(prev => ({ ...prev!, amenities: [...amenities, amenity] }));
                          } else {
                            setEditingRoom(prev => ({ ...prev!, amenities: amenities.filter(a => a !== amenity) }));
                          }
                        }}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Equipment (Select multiple)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Oxygen Supply', 'Nurse Call Button', 'Emergency Light', 'Cardiac Monitor', 'Ventilator', 'Defibrillator', 'IV Pump', 'Suction Machine'].map(equipment => (
                    <label key={equipment} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingRoom.equipment?.includes(equipment) || false}
                        onChange={(e) => {
                          const equipmentList = editingRoom.equipment || [];
                          if (e.target.checked) {
                            setEditingRoom(prev => ({ ...prev!, equipment: [...equipmentList, equipment] }));
                          } else {
                            setEditingRoom(prev => ({ ...prev!, equipment: equipmentList.filter(eq => eq !== equipment) }));
                          }
                        }}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm">{equipment}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRoom(null);
                    setError('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveRoom}
                  loading={loading}
                  className="flex-1"
                >
                  Save Room
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Patient Assignment Modal */}
        <Modal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedRoom(null);
            setSelectedPatient('');
            setError('');
          }}
          title="Assign Patient to Room"
          size="md"
        >
          {selectedRoom && (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <h4 className="font-semibold text-teal-900 mb-2">Room Details</h4>
                <p className="text-sm text-teal-800">
                  Room {selectedRoom.room_number} - {selectedRoom.room_type.replace('_', ' ')} - ₹{selectedRoom.daily_rate}/day
                </p>
                <p className="text-sm text-teal-800">
                  Floor {selectedRoom.floor_number} • {selectedRoom.bed_count} bed{selectedRoom.bed_count > 1 ? 's' : ''}
                </p>
              </div>

              <Select
                label="Select Patient *"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                options={[
                  { value: '', label: 'Choose patient for admission' },
                  ...patients.map(patient => ({
                    value: patient.id,
                    label: `${patient.name} (${patient.uid}) - ${patient.admission_type} admission`
                  }))
                ]}
                required
              />

              {selectedPatient && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h5 className="font-semibold text-blue-900 mb-1">Patient Information</h5>
                  {(() => {
                    const patient = patients.find(p => p.id === selectedPatient);
                    return patient ? (
                      <div className="text-sm text-blue-800">
                        <p>Name: {patient.name}</p>
                        <p>Age: {patient.age} years</p>
                        <p>Phone: {patient.phone}</p>
                        <p>Admission Type: {patient.admission_type}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedRoom(null);
                    setSelectedPatient('');
                    setError('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={assignPatientToRoom}
                  loading={loading}
                  disabled={!selectedPatient}
                  className="flex-1"
                >
                  Assign Patient
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Modal>
  );
};