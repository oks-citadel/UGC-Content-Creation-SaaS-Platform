import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { AppError } from '@nexus/utils';

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  phoneNumber?: string;
  timezone?: string;
  locale?: string;
}

export interface UpdateProfileInput {
  company?: string;
  jobTitle?: string;
  industry?: string;
  website?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  location?: string;
  country?: string;
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: 'SOLO' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
}

class UserService {
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        preferences: true,
        notifications: true,
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateUser(userId: string, input: UpdateUserInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
      include: {
        profile: true,
        preferences: true,
      },
    });

    return user;
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: input,
      create: {
        userId,
        ...input,
      },
    });

    return profile;
  }

  async getPreferences(userId: string) {
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }

  async updatePreferences(userId: string, input: Partial<{
    theme: string;
    language: string;
    dateFormat: string;
    timeFormat: string;
    weekStartsOn: number;
    compactMode: boolean;
    sidebarCollapsed: boolean;
  }>) {
    return prisma.userPreferences.upsert({
      where: { userId },
      update: input,
      create: { userId, ...input },
    });
  }

  async getNotificationSettings(userId: string) {
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateNotificationSettings(userId: string, input: Partial<{
    emailMarketing: boolean;
    emailProductUpdates: boolean;
    emailCampaignUpdates: boolean;
    emailCreatorMessages: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
  }>) {
    return prisma.notificationSettings.upsert({
      where: { userId },
      update: input,
      create: { userId, ...input },
    });
  }

  // Organization methods
  async createOrganization(userId: string, input: CreateOrganizationInput) {
    const slug = this.generateSlug(input.name);

    // Check if slug is unique
    const existing = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new AppError('Organization name is already taken', 409);
    }

    const organization = await prisma.organization.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        website: input.website,
        industry: input.industry,
        size: input.size,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return organization;
  }

  async getOrganization(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    return organization;
  }

  async getUserOrganizations(userId: string) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }));
  }

  async updateOrganization(organizationId: string, userId: string, input: Partial<CreateOrganizationInput>) {
    // Check if user is owner or admin
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new AppError('Not authorized to update this organization', 403);
    }

    return prisma.organization.update({
      where: { id: organizationId },
      data: input,
    });
  }

  async inviteMember(organizationId: string, inviterId: string, email: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') {
    // Check if inviter has permission
    const inviterMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: inviterId,
        },
      },
    });

    if (!inviterMembership || !['OWNER', 'ADMIN'].includes(inviterMembership.role)) {
      throw new AppError('Not authorized to invite members', 403);
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      const existingMembership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMembership) {
        throw new AppError('User is already a member of this organization', 409);
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.organizationInvitation.findFirst({
      where: {
        organizationId,
        email: email.toLowerCase(),
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new AppError('An invitation has already been sent to this email', 409);
    }

    // Create invitation
    const invitation = await prisma.organizationInvitation.create({
      data: {
        organizationId,
        email: email.toLowerCase(),
        role,
        token: uuidv4(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    // TODO: Send invitation email via notification service

    return invitation;
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invitation) {
      throw new AppError('Invalid invitation', 400);
    }

    if (invitation.acceptedAt) {
      throw new AppError('Invitation has already been accepted', 400);
    }

    if (invitation.expiresAt < new Date()) {
      throw new AppError('Invitation has expired', 400);
    }

    // Get user email to verify
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new AppError('This invitation was sent to a different email address', 403);
    }

    // Create membership and mark invitation as accepted
    await prisma.$transaction([
      prisma.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId,
          role: invitation.role,
        },
      }),
      prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return invitation.organization;
  }

  async removeMember(organizationId: string, requesterId: string, memberId: string) {
    // Check requester permissions
    const requesterMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: requesterId,
        },
      },
    });

    if (!requesterMembership || !['OWNER', 'ADMIN'].includes(requesterMembership.role)) {
      throw new AppError('Not authorized to remove members', 403);
    }

    // Get member to be removed
    const memberToRemove = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: memberId,
        },
      },
    });

    if (!memberToRemove) {
      throw new AppError('Member not found', 404);
    }

    // Cannot remove owner
    if (memberToRemove.role === 'OWNER') {
      throw new AppError('Cannot remove the organization owner', 403);
    }

    // Admin cannot remove other admins
    if (requesterMembership.role === 'ADMIN' && memberToRemove.role === 'ADMIN') {
      throw new AppError('Admins cannot remove other admins', 403);
    }

    await prisma.organizationMember.delete({
      where: { id: memberToRemove.id },
    });
  }

  async updateMemberRole(
    organizationId: string,
    requesterId: string,
    memberId: string,
    newRole: 'ADMIN' | 'MEMBER' | 'VIEWER'
  ) {
    // Check requester permissions
    const requesterMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: requesterId,
        },
      },
    });

    if (!requesterMembership || requesterMembership.role !== 'OWNER') {
      throw new AppError('Only the owner can change member roles', 403);
    }

    const memberToUpdate = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: memberId,
        },
      },
    });

    if (!memberToUpdate) {
      throw new AppError('Member not found', 404);
    }

    if (memberToUpdate.role === 'OWNER') {
      throw new AppError('Cannot change owner role', 403);
    }

    return prisma.organizationMember.update({
      where: { id: memberToUpdate.id },
      data: { role: newRole },
    });
  }

  async leaveOrganization(organizationId: string, userId: string) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new AppError('You are not a member of this organization', 404);
    }

    if (membership.role === 'OWNER') {
      // Check if there are other admins who can become owner
      const admins = await prisma.organizationMember.count({
        where: {
          organizationId,
          role: 'ADMIN',
        },
      });

      if (admins === 0) {
        throw new AppError('Cannot leave organization. Transfer ownership first or delete the organization.', 400);
      }
    }

    await prisma.organizationMember.delete({
      where: { id: membership.id },
    });
  }

  async deleteUser(userId: string) {
    // Soft delete - mark as deleted
    return prisma.user.update({
      where: { id: userId },
      data: { status: 'DELETED' },
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50) + '-' + uuidv4().substring(0, 8);
  }
}

export const userService = new UserService();
