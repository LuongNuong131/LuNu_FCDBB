import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Match } from '../fcdbb/entities/fcdbb.entity';

export interface RosterPlayer {
  userId: number;
  name: string;
  team: 'A' | 'B';
  homeTeam?: 'A' | 'B' | null;
}
export interface GoalEvent {
  userId: number;
  assistUserId: number | null;
  minute: number | null;
  ownGoal: boolean;
}

@Entity('seasons')
export class Season {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 100 }) name: string;
  @Column({ length: 10 }) starts_on: string;
  @Column({ length: 10 }) ends_on: string;
  @Column({ default: false }) archived: boolean;
  @CreateDateColumn() created_at: Date;
}

@Entity('match_reports')
export class MatchReport {
  @PrimaryColumn() match_id: number;
  @ManyToOne(() => Match, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'match_id' })
  match: Match;
  @Index() @Column({ type: 'int', nullable: true }) season_id: number | null;
  @ManyToOne(() => Season, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'season_id' })
  season: Season | null;
  @Column({ default: 'draft' }) status: string;
  @Column({ type: 'int', nullable: true }) score_a: number | null;
  @Column({ type: 'int', nullable: true }) score_b: number | null;
  @Column('simple-json') roster: RosterPlayer[];
  @Column('simple-json') goals: GoalEvent[];
  @Column({ type: 'int', nullable: true }) mvp_user_id: number | null;
  @Column({ type: 'text', default: '' }) notes: string;
  @Column({ default: 1 }) revision: number;
  @UpdateDateColumn() updated_at: Date;
}

// Keep actor names and complete before/after snapshots even when profiles change.
// No foreign keys to users or matches: an audit record must outlive its subject.
@Entity('match_audit')
export class MatchAudit {
  @PrimaryGeneratedColumn() id: number;
  @Index() @Column() match_id: number;
  @Column() actor_id: number;
  @Column() actor_name: string;
  @Column() action: string;
  @Column({ type: 'text', default: '' }) reason: string;
  @Column('simple-json', { nullable: true }) before: unknown;
  @Column('simple-json', { nullable: true }) after: unknown;
  @CreateDateColumn() created_at: Date;
}
