import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1767174459985 implements MigrationInterface {
  name = 'InitialMigration1767174459985';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "roles" text array NOT NULL DEFAULT '{user}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "roles"`);
  }
}
