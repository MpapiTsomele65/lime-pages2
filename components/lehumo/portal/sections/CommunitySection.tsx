"use client";

import type {
  CommunityPoolStats,
  FundPortfolio,
  LehumoMember,
} from "@/lib/definitions";
import { formatMemberNumber } from "@/lib/definitions";
import { SectionHeader } from "./SectionHeader";
import { CommunityPoolCard } from "../CommunityPoolCard";
import { LeaderboardCard } from "../LeaderboardCard";
import { WhereIsOurMoneyCard } from "../WhereIsOurMoneyCard";
import { QGMSummaryCard } from "../QGMSummaryCard";
import { SteeringCommitteeCard } from "../SteeringCommitteeCard";

interface CommunitySectionProps {
  member: LehumoMember;
  communityStats: CommunityPoolStats | null;
  fundPortfolio: FundPortfolio | null;
  myContributed: number;
  beforeLaunch: boolean;
}

export function CommunitySection({
  member,
  communityStats,
  fundPortfolio,
  myContributed,
  beforeLaunch,
}: CommunitySectionProps) {
  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="Community" title="Lehumo community" />

      {/* Community pool overview */}
      {communityStats && (
        <CommunityPoolCard
          stats={communityStats}
          myContributed={myContributed}
          beforeLaunch={beforeLaunch}
        />
      )}

      {/* Anonymised who-paid-first leaderboard */}
      {communityStats?.leaderboard && (
        <LeaderboardCard
          leaderboard={communityStats.leaderboard}
          viewerNumber={formatMemberNumber(member.memberNumber)}
          activeMembers={communityStats.activeMembers}
        />
      )}

      {/* Where is our money now? — allocation + strategy */}
      {fundPortfolio && (
        <div id="portfolio" className="scroll-mt-24">
          <WhereIsOurMoneyCard
            allocation={fundPortfolio.allocation}
            strategyNote={fundPortfolio.strategyNote}
            asAt={fundPortfolio.asAt}
            totalPool={communityStats?.totalPool ?? 0}
          />
        </div>
      )}

      {/* Governance row — QGM + Steering Committee, two-up */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div id="qgm" className="scroll-mt-24">
          <QGMSummaryCard />
        </div>
        <SteeringCommitteeCard member={member} />
      </div>
    </div>
  );
}
