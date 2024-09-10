import { relations } from 'drizzle-orm';
import { integer, json, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const feeds = pgTable('feeds', {
  id: text('id').primaryKey(),
  key: text('key').notNull()
});

export const roleEnum = pgEnum('role', ['admin', 'mod', 'user']);

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  role: roleEnum('role').notNull()
});

/*
  Snapshots are the temporary bursts of images from a feed.
  These are temporary and deleted after a period of time.
  They are created by the ingest service, after being triggered by a request.
*/

export const snapshotStatusEnum = pgEnum('status', ['pending', 'processing', 'complete']);

export const snapshots = pgTable('snapshots', {
  id: serial('id').primaryKey(),
  feedId: text('feed_id').notNull(),
  images: json('images').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at').notNull(),
  status: snapshotStatusEnum('status').default('pending').notNull(),
  captureId: integer('capture_id'),

  startCaptureAt: timestamp('start_capture_at').notNull(),
  endCaptureAt: timestamp('end_capture_at').notNull(),
  createdBy: text('created_by').notNull()
});

/*
  Captures are the long term storage & organization of snapshots.
  They have additional metadata and are not deleted.

  When a user creates a capture from a snapshot,
  the images they've are copied into the capture.
*/
export const captures = pgTable('captures', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at').notNull(),
  createdBy: text('created_by').notNull(),
  name: text('name')
});

export const capturesRelations = relations(captures, ({ many }) => ({
  capturesToObservations: many(capturesToObservations),
  images: many(images)
}));

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const images = pgTable('images', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  captureId: integer('capture_id')
    .references(() => captures.id)
    .notNull(),

  boundingBoxes: json('bounding_boxes').$type<BoundingBox[]>().default([]).notNull()
});

export const imagesRelations = relations(images, ({ one }) => ({
  capture: one(captures, {
    fields: [images.captureId],
    references: [captures.id]
  })
}));

export const observations = pgTable('observations', {
  id: serial('id').primaryKey(),
  inatId: integer('inat_id'),
  name: text('name').notNull()
});

/*
  The following schema is not particularly interesting, it just
  provides a way to link captures to observations and back.

  A capture can have many observations, but we also
  want to be able to look at all captures for a given observation (critter)
*/

export const observationsRelations = relations(observations, ({ many }) => ({
  capturesToObservations: many(capturesToObservations)
}));

export const capturesToObservations = pgTable('captures_to_observations', {
  captureId: integer('capture_id')
    .references(() => captures.id)
    .notNull(),
  observationId: integer('observation_id')
    .references(() => observations.id)
    .notNull()
});

export const capturesToObservationsRelations = relations(capturesToObservations, ({ one }) => ({
  capture: one(captures, {
    fields: [capturesToObservations.captureId],
    references: [captures.id]
  }),
  observation: one(observations, {
    fields: [capturesToObservations.observationId],
    references: [observations.id]
  })
}));
