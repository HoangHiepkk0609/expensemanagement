export type FamilyRole = 'owner' | 'member';

export interface Family {
  id: string;
  familyId: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  inviteCodeExpiredAt: any;
  totalBalance: number;
  createdAt: any;
}

export interface FamilyMember {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: FamilyRole;
  joinedAt: any;
  totalContributed: number;
  totalSpent: number;
}
