import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('auth_rate_buckets')
export class AuthRateBucket {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  key: string;

  @Column({ type: 'int', default: 0 })
  hits: number;

  @Index('IDX_auth_rate_buckets_expires_at')
  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;
}
