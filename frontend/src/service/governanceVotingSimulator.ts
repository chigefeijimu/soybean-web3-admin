import { request } from '@/service/request';

export function getDaos() {
  return request({
    url: '/governance-voting-simulator/daos',
    method: 'GET',
  });
}

export function getProposals(params?: { dao?: string; status?: string }) {
  return request({
    url: '/governance-voting-simulator/proposals',
    method: 'GET',
    params,
  });
}

export function getProposalById(id: string) {
  return request({
    url: `/governance-voting-simulator/proposals/${id}`,
    method: 'GET',
  });
}

export function getVotingScenarios() {
  return request({
    url: '/governance-voting-simulator/scenarios',
    method: 'GET',
  });
}

export function simulateVoting(proposalId: string, scenarioId: string) {
  return request({
    url: `/governance-voting-simulator/simulate/${proposalId}`,
    method: 'POST',
    data: { scenarioId },
  });
}

export function getVotingPowerAnalysis(proposalId: string) {
  return request({
    url: `/governance-voting-simulator/voting-power/${proposalId}`,
    method: 'GET',
  });
}

export function getTopDelegates(dao: string, limit?: number) {
  return request({
    url: `/governance-voting-simulator/delegates/${dao}`,
    method: 'GET',
    params: { limit },
  });
}

export function getVotingHistory(address: string, dao?: string) {
  return request({
    url: `/governance-voting-simulator/voting-history/${address}`,
    method: 'GET',
    params: { dao },
  });
}

export function getProposalTrends(dao?: string) {
  return request({
    url: '/governance-voting-simulator/trends',
    method: 'GET',
    params: { dao },
  });
}

export function calculateVoteImpact(
  proposalId: string,
  additionalVotes: number,
  voteType: 'for' | 'against'
) {
  return request({
    url: `/governance-voting-simulator/impact/${proposalId}`,
    method: 'POST',
    data: { additionalVotes, voteType },
  });
}
