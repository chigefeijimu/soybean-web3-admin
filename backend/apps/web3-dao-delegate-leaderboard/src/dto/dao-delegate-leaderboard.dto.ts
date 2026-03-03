export class QueryLeaderboardDto {
  daoName?: string;
  chain?: string;
  sortBy?: 'votingPower' | 'delegators' | 'participation' | 'reputation';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export class QueryDelegateDto {
  walletAddress: string;
  daoName?: string;
}

export class CreateAlertDto {
  walletAddress: string;
  daoName: string;
  alertType: 'voting_power_change' | 'new_delegation' | 'delegation_removed' | 'vote_missed';
  threshold?: number;
  enabled?: boolean;
}

export class UpdateAlertDto {
  enabled?: boolean;
  threshold?: number;
}
