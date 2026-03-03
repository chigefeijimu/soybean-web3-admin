import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class GovernanceAggregator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  daoName: string;

  @Column()
  chain: string;

  @Column()
  proposalId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  status: string; // active, passed, failed, executed, canceled

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  forVotes: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  againstVotes: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  abstainVotes: number;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ nullable: true })
  proposer: string;

  @Column({ default: 0 })
  totalVoters: number;

  @Column({ default: 0 })
  voterTurnout: number;

  @Column({ nullable: true })
  category: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity()
export class GovernanceDelegate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column()
  daoName: string;

  @Column()
  chain: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  votingPower: number;

  @Column({ default: 0 })
  delegatorsCount: number;

  @Column({ nullable: true })
  reputation: string; // legend, veteran, expert, trusted, new

  @Column({ default: 0 })
  proposalsParticipated: number;

  @Column({ default: 0 })
  proposalsVoted: number;

  @Column({ default: 0 })
  participationRate: number;

  @Column({ nullable: true })
  delegateSince: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity()
export class GovernanceStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chain: string;

  @Column()
  daoName: string;

  @Column({ default: 0 })
  totalProposals: number;

  @Column({ default: 0 })
  activeProposals: number;

  @Column({ default: 0 })
  totalDelegates: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  totalVotingPower: number;

  @Column({ default: 0 })
  avgParticipation: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
