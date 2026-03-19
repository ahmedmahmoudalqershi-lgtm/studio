export type Role = 'hospital' | 'engineer' | 'admin';
export type UserStatus = 'pending' | 'verified' | 'rejected';
export type DeviceStatus = 'operational' | 'needs_maintenance' | 'under_repair' | 'decommissioned';
export type RequestStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type Urgency = 'critical' | 'high' | 'medium' | 'low';

export interface User {
  id: number;
  email: string;
  role: Role;
  status: UserStatus;
}

export interface HospitalProfile {
  id: number;
  user_id: number;
  hospital_name: string;
  address: string;
  city: string;
  phone: string;
}

export interface EngineerProfile {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  specialization: string;
  years_experience: number;
  rating: number;
  total_jobs: number;
}

export interface Device {
  id: number;
  hospital_id: number;
  device_name: string;
  model: string;
  serial_number: string;
  manufacturer: string;
  last_maintenance_date: string;
  status: DeviceStatus;
  specialization: string;
}

export interface MaintenanceRequest {
  id: number;
  hospital_id: number;
  device_id: number;
  title: string;
  description: string;
  urgency: Urgency;
  status: RequestStatus;
  assigned_engineer_id?: number;
  created_at: string;
}

export interface Bid {
  id: number;
  request_id: number;
  engineer_id: number;
  price: number;
  estimated_days: number;
  description: string;
  status: BidStatus;
}

export const MOCK_HOSPITAL: HospitalProfile = {
  id: 1,
  user_id: 1,
  hospital_name: "مستشفى الأمل التخصصي",
  address: "طريق الملك فهد",
  city: "الرياض",
  phone: "0112233445"
};

export const MOCK_ENGINEER: EngineerProfile = {
  id: 1,
  user_id: 2,
  full_name: "المهندس أحمد علي",
  phone: "0556677889",
  specialization: "أجهزة الأشعة",
  years_experience: 8,
  rating: 4.8,
  total_jobs: 156
};

export const MOCK_DEVICES: Device[] = [
  {
    id: 1,
    hospital_id: 1,
    device_name: "جهاز رنين مغناطيسي",
    model: "Signa 1.5T",
    serial_number: "GE-123456",
    manufacturer: "GE Healthcare",
    last_maintenance_date: "2023-11-15",
    status: "operational",
    specialization: "radiology"
  },
  {
    id: 2,
    hospital_id: 1,
    device_name: "جهاز تنفس صناعي",
    model: "Evita V500",
    serial_number: "DR-789012",
    manufacturer: "Dräger",
    last_maintenance_date: "2024-01-10",
    status: "needs_maintenance",
    specialization: "icu"
  }
];

export const MOCK_REQUESTS: MaintenanceRequest[] = [
  {
    id: 1,
    hospital_id: 1,
    device_id: 2,
    title: "عطل في حساس الأكسجين",
    description: "تظهر رسالة خطأ عند محاولة معايرة حساس الأكسجين في جهاز التنفس الصناعي.",
    urgency: "high",
    status: "open",
    created_at: "2024-02-20T10:00:00Z"
  }
];

export const MOCK_BIDS: Bid[] = [
  {
    id: 1,
    request_id: 1,
    engineer_id: 1,
    price: 1500,
    estimated_days: 2,
    description: "لدي خبرة واسعة في أجهزة دريجر، يمكنني توفير الحساس الأصلي وبرمجته.",
    status: "pending"
  }
];
