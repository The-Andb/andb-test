CREATE TABLE `constraint_rename` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email_new` (`email`),
  KEY `idx_user_new` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
