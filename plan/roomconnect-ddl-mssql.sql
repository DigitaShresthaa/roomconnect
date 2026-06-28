
SET NOCOUNT ON;
GO

-- --------------------------------------------------------------------
-- 1) Users & roles
-- --------------------------------------------------------------------

CREATE TABLE dbo.users (
    id BIGINT IDENTITY(1,1) NOT NULL,
    role NVARCHAR(20) NOT NULL,
    full_name NVARCHAR(120) NOT NULL,
    email NVARCHAR(254) NOT NULL,
    phone NVARCHAR(32) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    is_verified BIT NOT NULL CONSTRAINT df_users_is_verified DEFAULT (0),
    is_active BIT NOT NULL CONSTRAINT df_users_is_active DEFAULT (1),
    last_login_at DATETIME2(0) NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT df_users_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at DATETIME2(0) NOT NULL CONSTRAINT df_users_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT pk_users PRIMARY KEY CLUSTERED (id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_phone UNIQUE (phone),
    CONSTRAINT ck_users_role CHECK (role IN (N'admin', N'owner', N'seeker'))
);
GO

CREATE INDEX idx_users_role ON dbo.users (role);
CREATE INDEX idx_users_active ON dbo.users (is_active);
GO

-- --------------------------------------------------------------------
-- 2) Admin-managed reference data: categories + location options
-- --------------------------------------------------------------------

CREATE TABLE dbo.categories (
    id BIGINT IDENTITY(1,1) NOT NULL,
    name NVARCHAR(80) NOT NULL,
    is_active BIT NOT NULL CONSTRAINT df_categories_is_active DEFAULT (1),
    created_at DATETIME2(0) NOT NULL CONSTRAINT df_categories_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at DATETIME2(0) NOT NULL CONSTRAINT df_categories_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT pk_categories PRIMARY KEY CLUSTERED (id),
    CONSTRAINT uq_categories_name UNIQUE (name)
);
GO

CREATE INDEX idx_categories_active ON dbo.categories (is_active);
GO

CREATE TABLE dbo.provinces (
    id BIGINT IDENTITY(1,1) NOT NULL,
    name NVARCHAR(80) NOT NULL,
    is_active BIT NOT NULL CONSTRAINT df_provinces_is_active DEFAULT (1),
    created_at DATETIME2(0) NOT NULL CONSTRAINT df_provinces_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at DATETIME2(0) NOT NULL CONSTRAINT df_provinces_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT pk_provinces PRIMARY KEY CLUSTERED (id),
    CONSTRAINT uq_provinces_name UNIQUE (name)
);
GO

CREATE INDEX idx_provinces_active ON dbo.provinces (is_active);
GO

CREATE TABLE dbo.districts (
    id BIGINT IDENTITY(1,1) NOT NULL,
    province_id BIGINT NOT NULL,
    name NVARCHAR(80) NOT NULL,
    is_active BIT NOT NULL CONSTRAINT df_districts_is_active DEFAULT (1),
    created_at DATETIME2(0) NOT NULL CONSTRAINT df_districts_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at DATETIME2(0) NOT NULL CONSTRAINT df_districts_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT pk_districts PRIMARY KEY CLUSTERED (id),
    CONSTRAINT uq_districts_province_name UNIQUE (province_id, name),
    CONSTRAINT fk_districts_province FOREIGN KEY (province_id) REFERENCES dbo.provinces (id) ON DELETE NO ACTION ON UPDATE CASCADE
);
GO

CREATE INDEX idx_districts_province ON dbo.districts (province_id);
CREATE INDEX idx_districts_active ON dbo.districts (is_active);
GO

CREATE TABLE dbo.localities (
    id BIGINT IDENTITY(1,1) NOT NULL,
    district_id BIGINT NOT NULL,
    name NVARCHAR(120) NOT NULL,
    is_active BIT NOT NULL CONSTRAINT df_localities_is_active DEFAULT (1),
    created_at DATETIME2(0) NOT NULL CONSTRAINT df_localities_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at DATETIME2(0) NOT NULL CONSTRAINT df_localities_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT pk_localities PRIMARY KEY CLUSTERED (id),
    CONSTRAINT uq_localities_district_name UNIQUE (district_id, name),
    CONSTRAINT fk_localities_district FOREIGN KEY (district_id) REFERENCES dbo.districts (id) ON DELETE NO ACTION ON UPDATE CASCADE
);
GO

CREATE INDEX idx_localities_district ON dbo.localities (district_id);
CREATE INDEX idx_localities_active ON dbo.localities (is_active);
GO

-- --------------------------------------------------------------------
-- 3) Listings
-- --------------------------------------------------------------------

CREATE TABLE dbo.listings (
    id BIGINT IDENTITY(1,1) NOT NULL,
    owner_id BIGINT NOT NULL,
    title NVARCHAR(160) NOT NULL,
    description NVARCHAR(MAX) NULL,
    category_id BIGINT NULL,
    price_amount DECIMAL(12,2) NOT NULL,
    price_period NVARCHAR(10) NOT NULL CONSTRAINT df_listings_price_period DEFAULT (N'month'),
    size_value DECIMAL(10,2) NULL,
    bedrooms TINYINT NOT NULL CONSTRAINT df_listings_bedrooms DEFAULT (1),
    halls TINYINT NOT NULL CONSTRAINT df_listings_halls DEFAULT (1),
    kitchens TINYINT NOT NULL CONSTRAINT df_listings_kitchens DEFAULT (1),
    bathrooms TINYINT NOT NULL CONSTRAINT df_listings_bathrooms DEFAULT (1),
    is_available BIT NOT NULL CONSTRAINT df_listings_is_available DEFAULT (1),
    is_hidden BIT NOT NULL CONSTRAINT df_listings_is_hidden DEFAULT (0),
    province_id BIGINT NOT NULL,
    district_id BIGINT NOT NULL,
    locality_id BIGINT NOT NULL,
    street NVARCHAR(180) NULL,
    amenities_text NVARCHAR(MAX) NULL,
    house_rules_text NVARCHAR(MAX) NULL,
    preferred_tenant_text NVARCHAR(MAX) NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT df_listings_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at DATETIME2(0) NOT NULL CONSTRAINT df_listings_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT pk_listings PRIMARY KEY CLUSTERED (id),
    CONSTRAINT ck_listings_price_period CHECK (price_period IN (N'month', N'week', N'day')),
    CONSTRAINT fk_listings_owner FOREIGN KEY (owner_id) REFERENCES dbo.users (id) ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT fk_listings_category FOREIGN KEY (category_id) REFERENCES dbo.categories (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_listings_province FOREIGN KEY (province_id) REFERENCES dbo.provinces (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT fk_listings_district FOREIGN KEY (district_id) REFERENCES dbo.districts (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT fk_listings_locality FOREIGN KEY (locality_id) REFERENCES dbo.localities (id) ON DELETE NO ACTION ON UPDATE NO ACTION
);
GO

CREATE INDEX idx_listings_owner ON dbo.listings (owner_id);
CREATE INDEX idx_listings_owner_created ON dbo.listings (owner_id, created_at);
CREATE INDEX idx_listings_category ON dbo.listings (category_id);
CREATE INDEX idx_listings_availability ON dbo.listings (is_available, is_hidden);
CREATE INDEX idx_listings_location ON dbo.listings (province_id, district_id, locality_id);
CREATE INDEX idx_listings_price ON dbo.listings (price_amount);
CREATE INDEX idx_listings_created ON dbo.listings (created_at);
GO

CREATE TABLE dbo.listing_media (
    id BIGINT IDENTITY(1,1) NOT NULL,
    listing_id BIGINT NOT NULL,
    media_type NVARCHAR(10) NOT NULL,
    file_path NVARCHAR(500) NOT NULL,
    sort_order INT NOT NULL CONSTRAINT df_listing_media_sort_order DEFAULT (0),
    created_at DATETIME2(0) NOT NULL CONSTRAINT df_listing_media_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT pk_listing_media PRIMARY KEY CLUSTERED (id),
    CONSTRAINT ck_listing_media_type CHECK (media_type IN (N'image', N'video')),
    CONSTRAINT fk_listing_media_listing FOREIGN KEY (listing_id) REFERENCES dbo.listings (id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

CREATE INDEX idx_listing_media_listing ON dbo.listing_media (listing_id, sort_order);
GO

-- --------------------------------------------------------------------
-- 4) Saved listings (favorites)
-- --------------------------------------------------------------------

CREATE TABLE dbo.saved_listings (
    user_id BIGINT NOT NULL,
    listing_id BIGINT NOT NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT df_saved_listings_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT pk_saved_listings PRIMARY KEY CLUSTERED (user_id, listing_id),
    CONSTRAINT fk_saved_listings_user FOREIGN KEY (user_id) REFERENCES dbo.users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_saved_listings_listing FOREIGN KEY (listing_id) REFERENCES dbo.listings (id) ON DELETE NO ACTION ON UPDATE  NO ACTION
);
GO

CREATE INDEX idx_saved_listings_listing ON dbo.saved_listings (listing_id);
GO

-- --------------------------------------------------------------------
-- 5) Inquiries (chat) + messages
-- --------------------------------------------------------------------

CREATE TABLE dbo.inquiries (
    id BIGINT IDENTITY(1,1) NOT NULL,
    listing_id BIGINT NOT NULL,
    seeker_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    status NVARCHAR(10) NOT NULL CONSTRAINT df_inquiries_status DEFAULT (N'new'),
    created_at DATETIME2(0) NOT NULL CONSTRAINT df_inquiries_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at DATETIME2(0) NOT NULL CONSTRAINT df_inquiries_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT pk_inquiries PRIMARY KEY CLUSTERED (id),
    CONSTRAINT uq_inquiries_unique_thread UNIQUE (listing_id, seeker_id),
    CONSTRAINT ck_inquiries_status CHECK (status IN (N'new', N'open', N'closed')),
    CONSTRAINT fk_inquiries_listing FOREIGN KEY (listing_id) REFERENCES dbo.listings (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inquiries_seeker FOREIGN KEY (seeker_id) REFERENCES dbo.users (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT fk_inquiries_owner FOREIGN KEY (owner_id) REFERENCES dbo.users (id) ON DELETE NO ACTION ON UPDATE NO ACTION
);
GO

CREATE INDEX idx_inquiries_owner ON dbo.inquiries (owner_id, status);
CREATE INDEX idx_inquiries_seeker ON dbo.inquiries (seeker_id, status);
CREATE INDEX idx_inquiries_listing ON dbo.inquiries (listing_id);
GO

CREATE TABLE dbo.inquiry_messages (
    id BIGINT IDENTITY(1,1) NOT NULL,
    inquiry_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    message_text NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT df_inquiry_messages_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT pk_inquiry_messages PRIMARY KEY CLUSTERED (id),
    CONSTRAINT fk_inquiry_messages_inquiry FOREIGN KEY (inquiry_id) REFERENCES dbo.inquiries (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inquiry_messages_sender FOREIGN KEY (sender_id) REFERENCES dbo.users (id) ON DELETE NO ACTION ON UPDATE NO ACTION
);
GO

CREATE INDEX idx_inquiry_messages_inquiry_time ON dbo.inquiry_messages (inquiry_id, created_at);
CREATE INDEX idx_inquiry_messages_sender ON dbo.inquiry_messages (sender_id);
GO

-- --------------------------------------------------------------------
-- 6) Reviews (user-to-user, one total per pair)
-- --------------------------------------------------------------------

CREATE TABLE dbo.user_reviews (
    id BIGINT IDENTITY(1,1) NOT NULL,
    reviewer_id BIGINT NOT NULL,
    reviewee_id BIGINT NOT NULL,
    rating TINYINT NOT NULL,
    review_text NVARCHAR(MAX) NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT df_user_reviews_created_at DEFAULT (SYSUTCDATETIME()),
    updated_at DATETIME2(0) NOT NULL CONSTRAINT df_user_reviews_updated_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT pk_user_reviews PRIMARY KEY CLUSTERED (id),
    CONSTRAINT uq_user_reviews_pair UNIQUE (reviewer_id, reviewee_id),
    CONSTRAINT ck_user_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT fk_user_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES dbo.users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_reviews_reviewee FOREIGN KEY (reviewee_id) REFERENCES dbo.users (id) ON DELETE  NO ACTION ON UPDATE  NO ACTION
);
GO

CREATE INDEX idx_user_reviews_reviewee ON dbo.user_reviews (reviewee_id, created_at);
GO

-- --------------------------------------------------------------------
-- 7) Admin audit logs
-- --------------------------------------------------------------------

CREATE TABLE dbo.audit_logs (
    id BIGINT IDENTITY(1,1) NOT NULL,
    admin_id BIGINT NOT NULL,
    action NVARCHAR(80) NOT NULL,
    target_type NVARCHAR(50) NOT NULL,
    target_id BIGINT NULL,
    metadata NVARCHAR(MAX) NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT df_audit_logs_created_at DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT pk_audit_logs PRIMARY KEY CLUSTERED (id),
    CONSTRAINT ck_audit_logs_metadata_json CHECK (metadata IS NULL OR ISJSON(metadata) = 1),
    CONSTRAINT fk_audit_logs_admin FOREIGN KEY (admin_id) REFERENCES dbo.users (id) ON DELETE NO ACTION ON UPDATE CASCADE
);
GO

CREATE INDEX idx_audit_logs_admin ON dbo.audit_logs (admin_id, created_at);
CREATE INDEX idx_audit_logs_target ON dbo.audit_logs (target_type, target_id);
GO

-- --------------------------------------------------------------------
-- 8) updated_at maintenance triggers
-- --------------------------------------------------------------------

CREATE OR ALTER TRIGGER dbo.trg_users_set_updated_at
ON dbo.users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(updated_at)
        RETURN;

    UPDATE u
    SET updated_at = SYSUTCDATETIME()
    FROM dbo.users AS u
    INNER JOIN inserted AS i ON i.id = u.id;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_categories_set_updated_at
ON dbo.categories
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(updated_at)
        RETURN;

    UPDATE c
    SET updated_at = SYSUTCDATETIME()
    FROM dbo.categories AS c
    INNER JOIN inserted AS i ON i.id = c.id;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_provinces_set_updated_at
ON dbo.provinces
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(updated_at)
        RETURN;

    UPDATE p
    SET updated_at = SYSUTCDATETIME()
    FROM dbo.provinces AS p
    INNER JOIN inserted AS i ON i.id = p.id;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_districts_set_updated_at
ON dbo.districts
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(updated_at)
        RETURN;

    UPDATE d
    SET updated_at = SYSUTCDATETIME()
    FROM dbo.districts AS d
    INNER JOIN inserted AS i ON i.id = d.id;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_localities_set_updated_at
ON dbo.localities
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(updated_at)
        RETURN;

    UPDATE l
    SET updated_at = SYSUTCDATETIME()
    FROM dbo.localities AS l
    INNER JOIN inserted AS i ON i.id = l.id;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_listings_set_updated_at
ON dbo.listings
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(updated_at)
        RETURN;

    UPDATE l
    SET updated_at = SYSUTCDATETIME()
    FROM dbo.listings AS l
    INNER JOIN inserted AS i ON i.id = l.id;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_inquiries_set_updated_at
ON dbo.inquiries
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(updated_at)
        RETURN;

    UPDATE i
    SET updated_at = SYSUTCDATETIME()
    FROM dbo.inquiries AS i
    INNER JOIN inserted AS ins ON ins.id = i.id;
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_user_reviews_set_updated_at
ON dbo.user_reviews
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(updated_at)
        RETURN;

    UPDATE r
    SET updated_at = SYSUTCDATETIME()
    FROM dbo.user_reviews AS r
    INNER JOIN inserted AS ins ON ins.id = r.id;
END;
GO
