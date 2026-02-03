-- Test eSIM Packages for Development
-- Run this SQL directly in your database to populate test packages

INSERT INTO esim_packages (package_code, country_code, country_name, region, data_amount, duration_days, network_type, wholesale_price, selling_price, markup_percentage, package_type, is_active, is_popular, purchase_count, last_synced_at, created_at, updated_at) VALUES
('US_1_7', 'US', 'United States', 'North America', 1024, 7, '4G/5G', 7080.00, 8496.00, 20.00, 'profile', 1, 1, 0, NOW(), NOW(), NOW()),
('US_3_30', 'US', 'United States', 'North America', 3072, 30, '4G/5G', 14160.00, 16992.00, 20.00, 'profile', 1, 1, 0, NOW(), NOW(), NOW()),
('GB_1_7', 'GB', 'United Kingdom', 'Europe', 1024, 7, '4G/5G', 7080.00, 8496.00, 20.00, 'profile', 1, 1, 0, NOW(), NOW(), NOW()),
('GB_5_30', 'GB', 'United Kingdom', 'Europe', 5120, 30, '4G/5G', 21240.00, 25488.00, 20.00, 'profile', 1, 0, 0, NOW(), NOW(), NOW()),
('NG_2_7', 'NG', 'Nigeria', 'Africa', 2048, 7, '4G/5G', 10620.00, 12744.00, 20.00, 'profile', 1, 1, 0, NOW(), NOW(), NOW()),
('AE_1_7', 'AE', 'United Arab Emirates', 'Middle East', 1024, 7, '4G/5G', 8496.00, 10195.00, 20.00, 'profile', 1, 0, 0, NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
  country_name = VALUES(country_name),
  region = VALUES(region),
  data_amount = VALUES(data_amount),
  duration_days = VALUES(duration_days),
  network_type = VALUES(network_type),
  wholesale_price = VALUES(wholesale_price),
  selling_price = VALUES(selling_price),
  is_active = VALUES(is_active),
  is_popular = VALUES(is_popular),
  updated_at = NOW();
