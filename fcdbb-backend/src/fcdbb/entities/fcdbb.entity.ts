import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) username: string;
  @Column() password?: string;
  @Column() name: string;
  @Column({ nullable: true }) nickname: string;
  @Column({ nullable: true }) dob: string;
  @Column({ default: 3 }) left_foot: number;
  @Column({ default: 3 }) right_foot: number;
  @Column('int', { nullable: true }) height: number;
  @Column('int', { nullable: true }) weight: number;
  @Column('decimal', { nullable: true }) bmi: number;
  @Column({ nullable: true }) phone: string;
  @Column({ nullable: true }) email: string;
  @Column({ default: 'Chưa rõ' }) position: string;
  @Column({ default: '/images/players/default.jpg' }) avatar: string;
  @Column({ default: 'user' }) role: string;
}

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn() id: number;
  @Column() title: string;
  @Column() location_name: string;
  @Column('decimal', { precision: 10, scale: 8 }) lat: number;
  @Column('decimal', { precision: 11, scale: 8 }) lng: number;
  @Column({ nullable: true }) map_link: string;
  @Column() start_time: Date;
  @Column() lock_time: Date;
  @Column() end_time: Date;
}

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => User) @JoinColumn({ name: 'user_id' }) user: User;
  @ManyToOne(() => Match) @JoinColumn({ name: 'match_id' }) match: Match;
  @Column() distance: number;
  @Column() status: string;
  @Column({ default: 0 }) delay_seconds: number;
  @CreateDateColumn() created_at: Date;
}

@Entity('funds')
export class Fund {
  @PrimaryGeneratedColumn() id: number;
  @Column() type: string;
  @Column() amount: number;
  @Column() reason: string;
  @Column({ nullable: true }) proof_image: string;
  @CreateDateColumn() created_at: Date;
}
