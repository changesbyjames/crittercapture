ALTER TABLE "images" ADD COLUMN "bounding_boxes" json DEFAULT '[]'::json NOT NULL;