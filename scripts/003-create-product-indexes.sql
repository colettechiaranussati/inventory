-- Create indexes for faster filtering and searching
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_products_user_id_inserted_at ON products(user_id, inserted_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_user_id_rating ON products(user_id, rating DESC);

-- Create a composite index for text search on name and brand
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(brand, '')));

-- Create index for usage status filtering
CREATE INDEX IF NOT EXISTS idx_products_usage_status ON products(usage_status);
