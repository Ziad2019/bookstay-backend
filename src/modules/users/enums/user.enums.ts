// Path: src/users/enums/user.enums.ts

export enum UserRole {
  CLIENT = 'client',
  OWNER = 'owner',
  ADMIN = 'admin',
}

export enum UserStatus {
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum UserBadge {
  NONE = 'none',
  VERIFIED = 'verified', // "معتمد / موثق" badge in Admin Users & Client Host Card
  VIP = 'vip',           // "مميز" badge in Admin Users table
}

export enum KycDocumentType {
  NATIONAL_ID = 'national_id', // بطاقة رقم قومي (14 رقم)
  PASSPORT = 'passport',       // جواز سفر
}

export enum KycRequestStatus {
  PENDING_REVIEW = 'pending_review',   // جديد — قيد الانتظار
  UNDER_REVIEW = 'under_review',       // تحت المراجعة
  NEEDS_DOCUMENTS = 'needs_documents', // يحتاج مستندات إضافية
  APPROVED = 'approved',               // مقبول
  REJECTED = 'rejected',               // مرفوض
}

export enum PayoutMethodType {
  BANK_ACCOUNT = 'bank_account',   // حساب بنكي
  INSTAPAY = 'instapay',           // InstaPay
  VODAFONE_CASH = 'vodafone_cash', // فودافون كاش
}