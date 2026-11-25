import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

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
  @Index('IDX_users_jersey_number', { unique: true })
  @Column({ type: 'int', nullable: true })
  jersey_number: number | null;
  @Column({ type: 'varchar', length: 1, nullable: true }) home_team:
    'A' | 'B' | null;
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
// Existing records have no source and are kept intact, including any historical duplicates.
@Index('IDX_attendance_match_user_recorded', ['match', 'user'], {
  unique: true,
  where: '"source" IS NOT NULL',
})
export class Attendance {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => User) @JoinColumn({ name: 'user_id' }) user: User;
  @ManyToOne(() => Match) @JoinColumn({ name: 'match_id' }) match: Match;
  @Column({ type: 'int', nullable: true }) distance: number | null;
  @Column({ type: 'varchar', length: 6, nullable: true })
  source: 'gps' | 'manual' | null;
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

@Entity('blog_posts')
export class BlogPost {
  @PrimaryGeneratedColumn() id: number;
  @Column() title: string;
  @Column({ nullable: true, type: 'text' }) excerpt: string;
  @Column({ nullable: true, type: 'text' }) content: string;
  @Column({ type: 'varchar', nullable: true }) image_url: string | null;
  @Column('simple-json', { nullable: true }) images: string[] | null;
  @Column({ default: 1 }) revision: number;
  @Column({ nullable: true }) author_id: number;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
