import { type FileEntry, type ProjectOptions } from '../types.js';

export function typeormFiles(_options: ProjectOptions): readonly FileEntry[] {
  return [
    { path: 'src/database/database.module.ts', content: databaseModuleTs() },
    { path: 'src/database/entities/user.entity.ts', content: userEntityTs() },
    { path: 'src/database/entities/session.entity.ts', content: sessionEntityTs() },
    { path: 'src/database/entities/account.entity.ts', content: accountEntityTs() },
    { path: 'src/database/entities/verification.entity.ts', content: verificationEntityTs() },
  ];
}

function databaseModuleTs(): string {
  return `import { Module } from '@nestjs/common';\nimport { ConfigModule, ConfigService } from '@nestjs/config';\nimport { TypeOrmModule } from '@nestjs/typeorm';\nimport { AccountEntity } from './entities/account.entity';\nimport { SessionEntity } from './entities/session.entity';\nimport { UserEntity } from './entities/user.entity';\nimport { VerificationEntity } from './entities/verification.entity';\n\n@Module({\n  imports: [\n    TypeOrmModule.forRootAsync({\n      imports: [ConfigModule],\n      inject: [ConfigService],\n      useFactory: (config: ConfigService) => ({\n        type: 'postgres',\n        url: config.getOrThrow<string>('DATABASE_URL'),\n        entities: [UserEntity, SessionEntity, AccountEntity, VerificationEntity],\n        synchronize: false,\n        migrationsRun: false,\n        logging: config.get<string>('NODE_ENV') !== 'production',\n      }),\n    }),\n  ],\n})\nexport class DatabaseModule {}\n`;
}

function userEntityTs(): string {
  return `import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';\nimport { AccountEntity } from './account.entity';\nimport { SessionEntity } from './session.entity';\n\n@Entity({ name: 'user' })\nexport class UserEntity {\n  @PrimaryColumn({ type: 'text' }) id!: string;\n  @Column({ type: 'text' }) name!: string;\n  @Column({ type: 'text', unique: true }) email!: string;\n  @Column({ name: 'email_verified', type: 'boolean', default: false }) emailVerified!: boolean;\n  @Column({ type: 'text', nullable: true }) image!: string | null;\n  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;\n  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;\n  @OneToMany(() => SessionEntity, (session) => session.user) sessions!: SessionEntity[];\n  @OneToMany(() => AccountEntity, (account) => account.user) accounts!: AccountEntity[];\n}\n`;
}

function sessionEntityTs(): string {
  return `import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';\nimport { UserEntity } from './user.entity';\n\n@Entity({ name: 'session' })\nexport class SessionEntity {\n  @PrimaryColumn({ type: 'text' }) id!: string;\n  @Column({ type: 'text', unique: true }) token!: string;\n  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt!: Date;\n  @Column({ name: 'ip_address', type: 'text', nullable: true }) ipAddress!: string | null;\n  @Column({ name: 'user_agent', type: 'text', nullable: true }) userAgent!: string | null;\n  @Column({ name: 'user_id', type: 'text' }) userId!: string;\n  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;\n  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;\n  @ManyToOne(() => UserEntity, (user) => user.sessions, { onDelete: 'CASCADE' })\n  @JoinColumn({ name: 'user_id' })\n  user!: UserEntity;\n}\n`;
}

function accountEntityTs(): string {
  return `import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';\nimport { UserEntity } from './user.entity';\n\n@Entity({ name: 'account' })\nexport class AccountEntity {\n  @PrimaryColumn({ type: 'text' }) id!: string;\n  @Column({ name: 'account_id', type: 'text' }) accountId!: string;\n  @Column({ name: 'provider_id', type: 'text' }) providerId!: string;\n  @Column({ name: 'user_id', type: 'text' }) userId!: string;\n  @Column({ name: 'access_token', type: 'text', nullable: true }) accessToken!: string | null;\n  @Column({ name: 'refresh_token', type: 'text', nullable: true }) refreshToken!: string | null;\n  @Column({ name: 'id_token', type: 'text', nullable: true }) idToken!: string | null;\n  @Column({ name: 'access_token_expires_at', type: 'timestamptz', nullable: true }) accessTokenExpiresAt!: Date | null;\n  @Column({ name: 'refresh_token_expires_at', type: 'timestamptz', nullable: true }) refreshTokenExpiresAt!: Date | null;\n  @Column({ type: 'text', nullable: true }) scope!: string | null;\n  @Column({ type: 'text', nullable: true }) password!: string | null;\n  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;\n  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;\n  @ManyToOne(() => UserEntity, (user) => user.accounts, { onDelete: 'CASCADE' })\n  @JoinColumn({ name: 'user_id' })\n  user!: UserEntity;\n}\n`;
}

function verificationEntityTs(): string {
  return `import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';\n\n@Entity({ name: 'verification' })\nexport class VerificationEntity {\n  @PrimaryColumn({ type: 'text' }) id!: string;\n  @Column({ type: 'text' }) identifier!: string;\n  @Column({ type: 'text' }) value!: string;\n  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt!: Date;\n  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;\n  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;\n}\n`;
}