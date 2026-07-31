-- GridLancer Database Schema for phpMyAdmin Import
-- Generated on 2026-07-05

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Database Creation
-- --------------------------------------------------------
DROP DATABASE IF EXISTS `gridlancer`;
CREATE DATABASE `gridlancer` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gridlancer`;


-- --------------------------------------------------------
-- Drop Existing Tables (Reverse Order of Dependencies)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `white_label_settings`;
DROP TABLE IF EXISTS `contracts`;
DROP TABLE IF EXISTS `template_milestones`;
DROP TABLE IF EXISTS `template_tasks`;
DROP TABLE IF EXISTS `project_templates`;
DROP TABLE IF EXISTS `time_entries`;
DROP TABLE IF EXISTS `recurring_invoices`;
DROP TABLE IF EXISTS `mock_emails`;
DROP TABLE IF EXISTS `email_preferences`;
DROP TABLE IF EXISTS `project_activities`;
DROP TABLE IF EXISTS `meetings`;
DROP TABLE IF EXISTS `milestones`;
DROP TABLE IF EXISTS `team_members`;
DROP TABLE IF EXISTS `teams`;
DROP TABLE IF EXISTS `complaints`;
DROP TABLE IF EXISTS `activity_log`;
DROP TABLE IF EXISTS `upgrade_requests`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `project_files`;
DROP TABLE IF EXISTS `project_messages`;
DROP TABLE IF EXISTS `project_tasks`;
DROP TABLE IF EXISTS `project_assignments`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `clients`;
DROP TABLE IF EXISTS `users`;

-- --------------------------------------------------------
-- 1. Table `users`
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `plan` VARCHAR(50) DEFAULT 'Starter',
  `role` VARCHAR(50) DEFAULT 'owner',
  `status` VARCHAR(50) DEFAULT 'active',
  `banned_until` DATETIME DEFAULT NULL,
  `unban_requested` TINYINT(1) DEFAULT 0,
  `ban_reason` VARCHAR(255) DEFAULT NULL,
  `warnings_count` INT DEFAULT 0,
  `trust_score` INT DEFAULT 100,
  `image` LONGTEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Table `clients`
-- --------------------------------------------------------
CREATE TABLE `clients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'active',
  `banned_until` DATETIME DEFAULT NULL,
  `unban_requested` TINYINT(1) DEFAULT 0,
  `image` LONGTEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Table `projects`
-- --------------------------------------------------------
CREATE TABLE `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `client_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `deadline` DATE DEFAULT NULL,
  `progress` INT DEFAULT 0,
  `status` VARCHAR(50) DEFAULT 'Pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Table `project_assignments`
-- --------------------------------------------------------
CREATE TABLE `project_assignments` (
  `project_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  PRIMARY KEY (`project_id`, `user_id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. Table `project_tasks`
-- --------------------------------------------------------
CREATE TABLE `project_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `weight` INT DEFAULT 0,
  `is_completed` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. Table `project_messages`
-- --------------------------------------------------------
CREATE TABLE `project_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `sender_type` VARCHAR(50) NOT NULL, -- 'freelancer' or 'client'
  `sender_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. Table `project_files`
-- --------------------------------------------------------
CREATE TABLE `project_files` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `size` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. Table `invoices`
-- --------------------------------------------------------
CREATE TABLE `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'Pending',
  `due_date` DATE DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. Table `system_settings`
-- --------------------------------------------------------
CREATE TABLE `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) UNIQUE NOT NULL,
  `value` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 10. Table `upgrade_requests`
-- --------------------------------------------------------
CREATE TABLE `upgrade_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `requested_plan` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'Pending',
  `payment_status` VARCHAR(50) DEFAULT 'Unpaid',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 11. Table `activity_log`
-- --------------------------------------------------------
CREATE TABLE `activity_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `activity_type` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 12. Table `complaints`
-- --------------------------------------------------------
CREATE TABLE `complaints` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT NOT NULL,
  `freelancer_id` INT NOT NULL,
  `project_id` INT NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `status` VARCHAR(50) DEFAULT 'Pending',
  `admin_response` TEXT DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT 'General',
  `evidence` VARCHAR(255) DEFAULT NULL,
  `evidence_name` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`freelancer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 13. Table `teams`
-- --------------------------------------------------------
CREATE TABLE `teams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `owner_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 14. Table `team_members`
-- --------------------------------------------------------
CREATE TABLE `team_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `team_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `role` VARCHAR(50) DEFAULT 'member',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 15. Table `milestones`
-- --------------------------------------------------------
CREATE TABLE `milestones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `amount` DECIMAL(10,2) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'Pending',
  `deadline` DATE DEFAULT NULL,
  `invoice_id` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 16. Table `meetings`
-- --------------------------------------------------------
CREATE TABLE `meetings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `scheduled_at` DATETIME NOT NULL,
  `duration` INT DEFAULT 30,
  `room_name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 17. Table `project_activities`
-- --------------------------------------------------------
CREATE TABLE `project_activities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `activity_type` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `created_by_type` VARCHAR(50) NOT NULL,
  `created_by_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 18. Table `email_preferences`
-- --------------------------------------------------------
CREATE TABLE `email_preferences` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `client_id` INT DEFAULT NULL,
  `category` VARCHAR(100) NOT NULL,
  `enabled` TINYINT(1) DEFAULT 1,
  UNIQUE KEY `unique_user_cat` (`user_id`, `category`),
  UNIQUE KEY `unique_client_cat` (`client_id`, `category`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 19. Table `mock_emails`
-- --------------------------------------------------------
CREATE TABLE `mock_emails` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `recipient_email` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  `sent_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 20. Table `recurring_invoices`
-- --------------------------------------------------------
CREATE TABLE `recurring_invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `frequency` VARCHAR(50) NOT NULL,
  `next_date` DATE NOT NULL,
  `status` VARCHAR(50) DEFAULT 'Active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 21. Table `time_entries`
-- --------------------------------------------------------
CREATE TABLE `time_entries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME DEFAULT NULL,
  `duration` INT DEFAULT 0,
  `is_manual` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 22. Table `project_templates`
-- --------------------------------------------------------
CREATE TABLE `project_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 23. Table `template_tasks`
-- --------------------------------------------------------
CREATE TABLE `template_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `template_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `weight` INT DEFAULT 0,
  FOREIGN KEY (`template_id`) REFERENCES `project_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 24. Table `template_milestones`
-- --------------------------------------------------------
CREATE TABLE `template_milestones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `template_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10,2) DEFAULT NULL,
  `suggested_days` INT DEFAULT 7,
  FOREIGN KEY (`template_id`) REFERENCES `project_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 25. Table `contracts`
-- --------------------------------------------------------
CREATE TABLE `contracts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `terms` TEXT NOT NULL,
  `scope` TEXT NOT NULL,
  `payment_terms` TEXT NOT NULL,
  `status` VARCHAR(50) DEFAULT 'Pending',
  `digital_signature` VARCHAR(255) DEFAULT NULL,
  `signed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 26. Table `white_label_settings`
-- --------------------------------------------------------
CREATE TABLE `white_label_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `logo_url` LONGTEXT DEFAULT NULL,
  `primary_color` VARCHAR(50) DEFAULT '#6366f1',
  `subdomain` VARCHAR(255) DEFAULT NULL UNIQUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------
-- Default Seeds
-- --------------------------------------------------------

-- Seed default system settings
INSERT INTO `system_settings` (`key`, `value`) 
VALUES ('admin_bank_account', '1234-5678-9012-3456 (GridLancer Main Bank)')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- Seed default project templates
INSERT INTO `project_templates` (`id`, `user_id`, `title`, `description`) VALUES
(1, NULL, 'Web Design & Development', 'Complete website build from design to deployment.'),
(2, NULL, 'Mobile App Development', 'iOS/Android application with core workflows.'),
(3, NULL, 'SEO Campaign', 'Comprehensive search engine optimization campaign.'),
(4, NULL, 'Graphic Design Brand Kit', 'Complete visual identity design.')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `description` = VALUES(`description`);

-- Seed default template tasks
INSERT INTO `template_tasks` (`id`, `template_id`, `title`, `weight`) VALUES
(1, 1, 'Design Concept', 20),
(2, 1, 'Frontend Setup', 20),
(3, 1, 'Backend Integration', 20),
(4, 1, 'Testing & Deploy', 20),
(5, 2, 'Wireframing & Prototypes', 20),
(6, 2, 'App Frontend Setup', 20),
(7, 2, 'Push Notifications Integration', 20),
(8, 2, 'App Store Submission Preparation', 20),
(9, 3, 'Keyword Research', 20),
(10, 3, 'On-Page Audit', 20),
(11, 3, 'Content Writing', 20),
(12, 3, 'Backlink Outreach', 20),
(13, 3, 'Monthly Reporting', 20),
(14, 4, 'Mood Board Development', 20),
(15, 4, 'Logo Concepts', 20),
(16, 4, 'Typography & Color Guide', 20),
(17, 4, 'Business Cards Layout', 20)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `weight` = VALUES(`weight`);

-- Seed default template milestones
INSERT INTO `template_milestones` (`id`, `template_id`, `title`, `amount`, `suggested_days`) VALUES
(1, 1, 'Design approved', NULL, 7),
(2, 1, 'Beta Release', NULL, 14),
(3, 1, 'Final Launch', NULL, 21),
(4, 2, 'App Design approved', NULL, 7),
(5, 2, 'TestFlight Beta Build', NULL, 14),
(6, 2, 'App Store Approval', NULL, 21),
(7, 3, 'Audit Delivery', NULL, 7),
(8, 3, 'Content Refresh completed', NULL, 14),
(9, 3, 'Ranking Progress Review', NULL, 21),
(10, 4, 'Mood Board Selected', NULL, 7),
(11, 4, 'Logo Finalized', NULL, 14),
(12, 4, 'Brand Book Delivered', NULL, 21)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `amount` = VALUES(`amount`), `suggested_days` = VALUES(`suggested_days`);

SET FOREIGN_KEY_CHECKS = 1;