import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const cache = sqliteTable('feed_cache', {key:text('key').primaryKey(),payload:text('payload').notNull().default('{}'),attemptedAt:integer('attempted_at').notNull().default(0),succeededAt:integer('succeeded_at').notNull().default(0),error:text('error')});
export const config = sqliteTable('site_config', {key:text('key').primaryKey(),value:text('value').notNull()});
export const leases = sqliteTable('refresh_leases', {key:text('key').primaryKey(),expires:integer('expires').notNull()});
