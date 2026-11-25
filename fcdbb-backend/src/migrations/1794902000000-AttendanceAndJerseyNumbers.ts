import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AttendanceAndJerseyNumbers1794902000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    // A new SQLite database gets the full schema from synchronize after migrations.
    if (!(await q.hasTable('users'))) return;

    if (!(await q.hasColumn('users', 'jersey_number')))
      await q.addColumn(
        'users',
        new TableColumn({
          name: 'jersey_number',
          type: 'integer',
          isNullable: true,
        }),
      );
    const users: { id: number; jersey_number: number | null }[] = await q.query(
      'SELECT id, jersey_number FROM users ORDER BY id',
    );
    const used = new Set(users.map((user) => user.jersey_number));
    const available = Array.from({ length: 99 }, (_, i) => i + 1).filter(
      (number) => !used.has(number),
    );
    for (const user of users) {
      if (user.jersey_number !== null) continue;
      const number = available.shift();
      if (number === undefined) break;
      await q.connection
        .createQueryBuilder(q)
        .update('users')
        .set({ jersey_number: number })
        .where('id = :id', { id: user.id })
        .execute();
    }
    if (
      !(await q.getTable('users'))?.indices.some(
        (i) => i.name === 'IDX_users_jersey_number',
      )
    )
      await q.createIndex(
        'users',
        new TableIndex({
          name: 'IDX_users_jersey_number',
          columnNames: ['jersey_number'],
          isUnique: true,
        }),
      );

    const attendance = await q.getTable('attendance');
    if (!attendance) return;
    const distance = attendance.findColumnByName('distance');
    if (distance && !distance.isNullable) {
      const nullableDistance = distance.clone();
      nullableDistance.isNullable = true;
      await q.changeColumn(attendance, distance, nullableDistance);
    }
    if (!attendance.findColumnByName('source'))
      await q.addColumn(
        'attendance',
        new TableColumn({
          name: 'source',
          type: 'varchar',
          length: '6',
          isNullable: true,
        }),
      );
    if (
      !attendance.indices.some(
        (i) => i.name === 'IDX_attendance_match_user_recorded',
      )
    )
      await q.createIndex(
        'attendance',
        new TableIndex({
          name: 'IDX_attendance_match_user_recorded',
          columnNames: ['match_id', 'user_id'],
          isUnique: true,
          where: '"source" IS NOT NULL',
        }),
      );
  }

  async down(): Promise<void> {
    throw new Error(
      'Giữ số áo và dữ liệu điểm danh bổ sung khi rollback ứng dụng.',
    );
  }
}
