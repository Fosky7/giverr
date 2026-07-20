// src/mocks/campaigns.ts
// Sample campaigns rendered whenever the real `campaigns` table is missing,
// RLS blocks anon reads, or the query returns zero rows. Real rows always
// win. End-users can ask "remove all mock data" to opt out.

import type { Campaign } from "@/types/campaign";

export interface MockCampaign extends Campaign {
  __mock: true;
}

const now = new Date();
const inDays = (n: number) =>
  new Date(now.getTime() + n * 86_400_000).toISOString();

export const mockCampaigns: MockCampaign[] = [
  {
    id: "mock-cmp-1",
    title: "Solar-powered classrooms for rural schools",
    description: "Bring reliable electricity and internet to 12 primary schools so every student can learn after sunset.",
    category: "Education",
    mediaUrls: [],
    goalAmount: 25000,
    currency: "USD",
    deadline: inDays(28),
    donorWallEnabled: true,
    raisedAmount: 8420,
    backersCount: 132,
    status: "active",
    created_at: inDays(-6),
    __mock: true,
  },
  {
    id: "mock-cmp-2",
    title: "Mobile health clinic for coastal villages",
    description: "Fund a fully equipped mobile clinic serving four remote villages that currently travel 40+ km for basic care.",
    category: "Health",
    mediaUrls: [],
    goalAmount: 40000,
    currency: "USD",
    deadline: inDays(45),
    donorWallEnabled: true,
    raisedAmount: 17650,
    backersCount: 289,
    status: "active",
    created_at: inDays(-14),
    __mock: true,
  },
  {
    id: "mock-cmp-3",
    title: "Community mangrove restoration",
    description: "Plant 50,000 mangrove seedlings with local youth crews to rebuild a storm-battered coastline.",
    category: "Environment",
    mediaUrls: [],
    goalAmount: 12000,
    currency: "USD",
    deadline: inDays(60),
    donorWallEnabled: true,
    raisedAmount: 4310,
    backersCount: 74,
    status: "active",
    created_at: inDays(-3),
    __mock: true,
  },
  {
    id: "mock-cmp-4",
    title: "Open-source screen reader for low-vision users",
    description: "Ship a free, offline-first screen reader with African-language voices — built by a volunteer engineering team.",
    category: "Technology",
    mediaUrls: [],
    goalAmount: 18000,
    currency: "USD",
    deadline: inDays(22),
    donorWallEnabled: true,
    raisedAmount: 11200,
    backersCount: 201,
    status: "active",
    created_at: inDays(-21),
    __mock: true,
  },
  {
    id: "mock-cmp-5",
    title: "After-school art studio for teens",
    description: "Convert an unused library wing into a free art studio: supplies, mentors, and monthly exhibitions.",
    category: "Arts",
    mediaUrls: [],
    goalAmount: 8000,
    currency: "USD",
    deadline: inDays(35),
    donorWallEnabled: true,
    raisedAmount: 2450,
    backersCount: 58,
    status: "active",
    created_at: inDays(-9),
    __mock: true,
  },
  {
    id: "mock-cmp-6",
    title: "Girls' football league — full season sponsorship",
    description: "Kits, transport, and coaching stipends for 8 teams across the region for the upcoming season.",
    category: "Sports",
    mediaUrls: [],
    goalAmount: 15000,
    currency: "USD",
    deadline: inDays(50),
    donorWallEnabled: true,
    raisedAmount: 6120,
    backersCount: 96,
    status: "active",
    created_at: inDays(-11),
    __mock: true,
  },
];

export function isMockCampaign(c: Campaign): c is MockCampaign {
  return (c as MockCampaign).__mock === true;
}
