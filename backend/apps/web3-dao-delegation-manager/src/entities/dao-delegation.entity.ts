import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('dao_delegations')
export class DaoDelegation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: string;

  @Column()
  walletAddress: string;

  @Column()
  daoName: string;

  @Column()
  tokenSymbol: string;

  @Column({ nullable: true })
  delegateAddress: string;

  @Column({ type: 'decimal', precision: 30, scale: 0, default: 0 })
  votingPower: string;

  @Column({ default: 'active' })
  status: string; // active, revoked, pending

  @Column({ nullable: true })
  chain: string;

  @Column({ type: 'timestamp', nullable: true })
  delegationDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUpdated: Date;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('dao_delegation_history')
export class DaoDelegationHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  walletAddress: string;

  @Column()
  daoName: string;

  @Column()
  tokenSymbol: string;

  @Column()
  fromDelegate: string;

  @Column()
  toDelegate: string;

  @Column({ type: 'decimal', precision: 30, scale: 0, default: 0 })
  votingPower: string;

  @Column()
  action: string; // delegate, revoke, redelegate

  @Column({ nullable: true })
  chain: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ nullable: true })
  txHash: string;
}

@Entity('dao_delegation_alerts')
export class DaoDelegationAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: string;

  @Column()
  walletAddress: string;

  @Column()
  daoName: string;

  @Column()
  alertType: string; // voting_power_change, new_delegate, delegation_revoked

  @Column()
  condition: string; // above, below, changed

  @Column({ type: 'decimal', precision: 30, scale: 0, nullable: true })
  threshold: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ nullable: true })
  webhookUrl: string;

  @Column({ nullable: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
