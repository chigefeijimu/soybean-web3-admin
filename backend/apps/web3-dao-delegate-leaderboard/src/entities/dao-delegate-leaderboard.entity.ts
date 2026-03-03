import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('dao_delegate_leaderboard')
export class DaoDelegateLeaderboard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  walletAddress: string;

  @Column()
  daoName: string;

  @Column()
  chain: string;

  @Column({ type: 'decimal', precision: 36, scale: 0, default: 0 })
  votingPower: string;

  @Column({ default: 0 })
  delegatorsCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  participationRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  proposalSupportRate: number;

  @Column({ default: 0 })
  proposalsVoted: number;

  @Column({ default: 0 })
  votesCast: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  reputationScore: number;

  @Column({ default: 'new' })
  reputationLevel: string;

  @Column({ nullable: true })
  lastActiveAt: Date;

  @Column({ nullable: true })
  firstDelegatedAt: Date;

  @Column({ type: 'simple-json', nullable: true })
  recentVotes: any;

  @Column({ type: 'simple-json', nullable: true })
  delegateInfo: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('dao_delegate_alerts')
export class DaoDelegateAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  walletAddress: string;

  @Column()
  daoName: string;

  @Column()
  alertType: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  threshold: number;

  @Column({ default: true })
  enabled: boolean;

  @Column({ nullable: true })
  lastTriggeredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
