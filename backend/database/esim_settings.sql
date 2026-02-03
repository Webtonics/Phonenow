-- eSIM Settings - Insert directly into database
-- Run this in your MySQL client or via command line

USE phonenow;

-- Insert eSIM Pricing Settings
INSERT INTO settings (id, `key`, `value`, `type`, `group`, description, created_at, updated_at)
VALUES
    (NULL, 'esim_profile_markup', '100', 'float', 'pricing', 'Markup percentage for eSIM profiles (100 = 2x wholesale cost)', NOW(), NOW()),
    (NULL, 'esim_data_markup', '150', 'float', 'pricing', 'Markup percentage for eSIM data bundles (150 = 2.5x wholesale cost)', NOW(), NOW()),
    (NULL, 'esim_auto_sync', '1', 'boolean', 'esim', 'Automatically sync eSIM packages from API daily', NOW(), NOW()),
    (NULL, 'esim_sync_frequency_hours', '24', 'integer', 'esim', 'How often to sync eSIM packages (in hours)', NOW(), NOW()),
    (NULL, 'esim_low_data_threshold', '20', 'integer', 'esim', 'Send low data warning when remaining data drops below this percentage', NOW(), NOW()),
    (NULL, 'esim_expiry_warning_days', '3', 'integer', 'esim', 'Send expiry warning this many days before eSIM expires', NOW(), NOW()),
    (NULL, 'esim_enable_usage_notifications', '1', 'boolean', 'esim', 'Enable email notifications for low data and expiry warnings', NOW(), NOW()),
    (NULL, 'esim_enable_auto_topup', '0', 'boolean', 'esim', 'Enable automatic top-up when data is low (future feature)', NOW(), NOW()),
    (NULL, 'esim_min_purchase_amount', '1000', 'float', 'esim', 'Minimum amount for eSIM purchases in NGN', NOW(), NOW()),
    (NULL, 'esim_max_profiles_per_user', '10', 'integer', 'esim', 'Maximum number of active eSIM profiles per user (0 = unlimited)', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    `value` = VALUES(`value`),
    updated_at = NOW();

SELECT 'eSIM settings inserted successfully!' AS result;
