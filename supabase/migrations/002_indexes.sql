-- CITIES / AREAS / SOCIETIES
CREATE INDEX idx_areas_city         ON areas(city_id);
CREATE INDEX idx_societies_area     ON societies(area_id);
CREATE INDEX idx_societies_city     ON societies(city_id);
CREATE INDEX idx_societies_featured ON societies(is_featured) WHERE is_featured = true;

-- LISTINGS (most important — high query volume)
CREATE INDEX idx_listings_city      ON listings(city_id)     WHERE status = 'active';
CREATE INDEX idx_listings_area      ON listings(area_id)     WHERE status = 'active';
CREATE INDEX idx_listings_society   ON listings(society_id)  WHERE status = 'active';
CREATE INDEX idx_listings_purpose   ON listings(purpose)     WHERE status = 'active';
CREATE INDEX idx_listings_type      ON listings(type)        WHERE status = 'active';
CREATE INDEX idx_listings_price     ON listings(price)       WHERE status = 'active';
CREATE INDEX idx_listings_beds      ON listings(beds)        WHERE status = 'active';
CREATE INDEX idx_listings_agent     ON listings(agent_id);
CREATE INDEX idx_listings_status    ON listings(status);
CREATE INDEX idx_listings_featured  ON listings(is_featured) WHERE is_featured = true;
CREATE INDEX idx_listings_hot_deal  ON listings(is_hot_deal) WHERE is_hot_deal = true;
CREATE INDEX idx_listings_created   ON listings(created_at DESC);
CREATE INDEX idx_listings_geo       ON listings USING GIST(location_point);

-- FULL-TEXT SEARCH on listings
ALTER TABLE listings ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(title,'') || ' ' ||
      COALESCE(description,'') || ' ' ||
      COALESCE(address,'')
    )
  ) STORED;
CREATE INDEX idx_listings_fts ON listings USING GIN(search_vector);

-- LISTING IMAGES
CREATE INDEX idx_images_listing ON listing_images(listing_id, display_order);

-- PROJECTS
CREATE INDEX idx_projects_city   ON projects(city_id)         WHERE status_platform = 'active';
CREATE INDEX idx_projects_type   ON projects(property_type)   WHERE status_platform = 'active';
CREATE INDEX idx_projects_status ON projects(status)          WHERE status_platform = 'active';
CREATE INDEX idx_projects_featured ON projects(is_featured)   WHERE is_featured = true;

-- LEADS
CREATE INDEX idx_leads_agent    ON leads(agent_id);
CREATE INDEX idx_leads_listing  ON leads(listing_id);
CREATE INDEX idx_leads_status   ON leads(status);
CREATE INDEX idx_leads_created  ON leads(created_at DESC);

-- BLOG
CREATE INDEX idx_blog_status    ON blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_category  ON blog_posts(category_id);
CREATE INDEX idx_blog_fts       ON blog_posts
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(excerpt,'')));

-- USERS / AGENTS
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_phone    ON users(phone);
CREATE INDEX idx_agent_slug     ON agent_profiles(profile_slug);
CREATE INDEX idx_agent_user     ON agent_profiles(user_id);

-- SUBSCRIPTIONS
CREATE INDEX idx_subs_user      ON subscriptions(user_id);
CREATE INDEX idx_subs_status    ON subscriptions(status);
CREATE INDEX idx_subs_ends      ON subscriptions(ends_at);

-- PAYMENTS
CREATE INDEX idx_payments_user   ON payment_transactions(user_id);
CREATE INDEX idx_payments_status ON payment_transactions(status);
CREATE INDEX idx_payments_method ON payment_transactions(method);

-- NOTIFICATIONS
CREATE INDEX idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- REDIRECTS
CREATE INDEX idx_redirects_path ON redirects(from_path) WHERE is_active = true;

-- MEDIA
CREATE INDEX idx_media_folder   ON media_library(folder);
CREATE INDEX idx_media_uploaded ON media_library(uploaded_by);

-- PROPERTY ALERTS
CREATE INDEX idx_alerts_user ON property_alerts(user_id) WHERE is_active = true;

-- BOOSTS
CREATE INDEX idx_boosts_listing ON listing_boosts(listing_id, is_active, ends_at);

-- FORUM
CREATE INDEX idx_forum_topics_category ON forum_topics(category);
CREATE INDEX idx_forum_replies_topic   ON forum_replies(topic_id);
