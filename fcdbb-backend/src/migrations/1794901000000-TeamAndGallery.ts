import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Add nullable/defaulted columns; do not infer teams or rewrite historical reports. */
export class TeamAndGallery1794901000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    if (!(await q.hasColumn('users', 'home_team')))
      await q.addColumn(
        'users',
        new TableColumn({
          name: 'home_team',
          type: 'varchar',
          length: '1',
          isNullable: true,
        }),
      );
    if (!(await q.hasColumn('blog_posts', 'images')))
      await q.addColumn(
        'blog_posts',
        new TableColumn({ name: 'images', type: 'text', isNullable: true }),
      );
    if (!(await q.hasColumn('blog_posts', 'revision')))
      await q.addColumn(
        'blog_posts',
        new TableColumn({ name: 'revision', type: 'integer', default: 1 }),
      );
  }
  async down(): Promise<void> {
    throw new Error(
      'Giữ các cột đội cố định và album để tránh mất dữ liệu khi rollback ứng dụng.',
    );
  }
}
