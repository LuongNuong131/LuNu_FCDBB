import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/** Additive PostgreSQL migration. Existing tables and data are never rebuilt. */
export class ClubManagement1794900000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    const timestamp =
      q.connection.options.type === 'postgres' ? 'timestamp' : 'datetime';
    await q.createTable(
      new Table({
        name: 'seasons',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '100' },
          { name: 'starts_on', type: 'varchar', length: '10' },
          { name: 'ends_on', type: 'varchar', length: '10' },
          { name: 'archived', type: 'boolean', default: false },
          { name: 'created_at', type: timestamp, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await q.createTable(
      new Table({
        name: 'match_reports',
        columns: [
          { name: 'match_id', type: 'integer', isPrimary: true },
          { name: 'season_id', type: 'integer', isNullable: true },
          { name: 'status', type: 'varchar', default: "'draft'" },
          { name: 'score_a', type: 'integer', isNullable: true },
          { name: 'score_b', type: 'integer', isNullable: true },
          { name: 'roster', type: 'text' },
          { name: 'goals', type: 'text' },
          { name: 'mvp_user_id', type: 'integer', isNullable: true },
          { name: 'notes', type: 'text', default: "''" },
          { name: 'revision', type: 'integer', default: 1 },
          { name: 'updated_at', type: timestamp, default: 'CURRENT_TIMESTAMP' },
        ],
        indices: [
          new TableIndex({
            name: 'IDX_reports_season',
            columnNames: ['season_id'],
          }),
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['match_id'],
            referencedTableName: 'matches',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          }),
          new TableForeignKey({
            columnNames: ['season_id'],
            referencedTableName: 'seasons',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          }),
        ],
      }),
      true,
    );
    await q.createTable(
      new Table({
        name: 'match_audit',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'match_id', type: 'integer' },
          { name: 'actor_id', type: 'integer' },
          { name: 'actor_name', type: 'varchar' },
          { name: 'action', type: 'varchar' },
          { name: 'reason', type: 'text', default: "''" },
          { name: 'before', type: 'text', isNullable: true },
          { name: 'after', type: 'text', isNullable: true },
          { name: 'created_at', type: timestamp, default: 'CURRENT_TIMESTAMP' },
        ],
        indices: [
          new TableIndex({
            name: 'IDX_audit_match',
            columnNames: ['match_id'],
          }),
        ],
      }),
      true,
    );
  }
  async down(): Promise<void> {
    throw new Error(
      'Rollback bị chặn để bảo toàn biên bản và lịch sử. Khôi phục từ backup nếu cần.',
    );
  }
}
