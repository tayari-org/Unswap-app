-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "avatar_url" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "institution" TEXT,
    "job_title" TEXT,
    "duty_station" TEXT,
    "languages" TEXT NOT NULL DEFAULT '[]',
    "verification_status" TEXT NOT NULL DEFAULT 'unverified',
    "institutional_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "subscription_plan_id" TEXT,
    "subscription_status" TEXT NOT NULL DEFAULT 'inactive',
    "subscription_renewal_date" DATETIME,
    "has_first_year_guarantee" BOOLEAN NOT NULL DEFAULT false,
    "guest_points" INTEGER NOT NULL DEFAULT 500,
    "points_escrow" INTEGER NOT NULL DEFAULT 0,
    "referral_code" TEXT,
    "referred_by" TEXT,
    "referred_users_verified_count" INTEGER NOT NULL DEFAULT 0,
    "referral_earnings" REAL NOT NULL DEFAULT 0,
    "notification_preferences" TEXT NOT NULL DEFAULT '{}',
    "swap_preferences" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "owner_email" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "property_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "duty_station" TEXT,
    "bedrooms" INTEGER NOT NULL DEFAULT 1,
    "bathrooms" INTEGER NOT NULL DEFAULT 1,
    "max_guests" INTEGER NOT NULL DEFAULT 2,
    "square_meters" REAL,
    "amenities" TEXT NOT NULL DEFAULT '[]',
    "photos" TEXT NOT NULL DEFAULT '[]',
    "swap_types_accepted" TEXT NOT NULL DEFAULT '["reciprocal"]',
    "availability" TEXT,
    "nightly_points" INTEGER NOT NULL DEFAULT 100,
    "guest_points_value" REAL,
    "total_swaps" INTEGER NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "average_rating" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SwapRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requester_email" TEXT NOT NULL,
    "host_email" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "requester_property_id" TEXT,
    "property_title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "swap_type" TEXT NOT NULL DEFAULT 'reciprocal',
    "check_in" DATETIME,
    "check_out" DATETIME,
    "duration_nights" INTEGER,
    "purpose" TEXT,
    "party_size" INTEGER NOT NULL DEFAULT 1,
    "total_points" INTEGER,
    "points_in_escrow" BOOLEAN NOT NULL DEFAULT false,
    "waiver_signed" BOOLEAN NOT NULL DEFAULT false,
    "waiver_signed_at" DATETIME,
    "insurance_activated" BOOLEAN NOT NULL DEFAULT false,
    "video_call_completed" BOOLEAN NOT NULL DEFAULT false,
    "video_call_id" TEXT,
    "counter_check_in" DATETIME,
    "counter_check_out" DATETIME,
    "counter_notes" TEXT,
    "completed_at" DATETIME,
    "requester_completed" BOOLEAN NOT NULL DEFAULT false,
    "host_completed" BOOLEAN NOT NULL DEFAULT false,
    "requester_rating" REAL,
    "host_rating" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sender_email" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "swap_request_id" TEXT,
    "conversation_id" TEXT,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "message_type" TEXT NOT NULL DEFAULT 'text',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "related_id" TEXT,
    "sender_email" TEXT,
    "sender_name" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_email" TEXT NOT NULL,
    "verification_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "document_url" TEXT,
    "document_type" TEXT,
    "notes" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "property_id" TEXT NOT NULL,
    "author_email" TEXT NOT NULL,
    "target_email" TEXT,
    "swap_request_id" TEXT,
    "rating" REAL NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VideoCall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "host_email" TEXT NOT NULL,
    "guest_email" TEXT NOT NULL,
    "property_id" TEXT,
    "room_id" TEXT,
    "room_url" TEXT,
    "scheduled_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "meeting_completed" BOOLEAN NOT NULL DEFAULT false,
    "call_ended_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "type" TEXT NOT NULL,
    "exchanges_per_year" INTEGER,
    "property_guarantee_amount" REAL,
    "max_swaps" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "features" TEXT NOT NULL DEFAULT '[]',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_email" TEXT NOT NULL,
    "subscription_plan_id" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_gateway_id" TEXT,
    "payment_method" TEXT,
    "receipt_url" TEXT,
    "transaction_type" TEXT NOT NULL,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GuestPointTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_email" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "description" TEXT,
    "related_id" TEXT,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrer_email" TEXT NOT NULL,
    "referred_email" TEXT NOT NULL,
    "referred_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "referred_user_status" TEXT NOT NULL DEFAULT 'invited',
    "referrer_reward_status" TEXT NOT NULL DEFAULT 'no_reward',
    "reward_details" TEXT,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activity_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location_from" TEXT,
    "location_to" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform_name" TEXT NOT NULL DEFAULT 'Unswap',
    "platform_status" TEXT NOT NULL DEFAULT 'pre_launch',
    "founders_waiver_enabled" BOOLEAN NOT NULL DEFAULT true,
    "required_verified_referrals_for_waiver" INTEGER NOT NULL DEFAULT 5,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "waitlist_enabled" BOOLEAN NOT NULL DEFAULT true,
    "max_properties_per_user" INTEGER NOT NULL DEFAULT 3,
    "early_bird_discount_pct" REAL NOT NULL DEFAULT 50,
    "early_bird_slots" INTEGER NOT NULL DEFAULT 500,
    "trust_first_refund_days" INTEGER NOT NULL DEFAULT 30,
    "guest_points_per_swap_night" INTEGER NOT NULL DEFAULT 10,
    "institutional_email_domains" TEXT,
    "public_settings" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referral_code_key" ON "User"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referred_email_key" ON "Referral"("referred_email");
