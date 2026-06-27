-- AlterTable
ALTER TABLE `UserSettings` ADD COLUMN `ai_chat_model` VARCHAR(191) NULL,
    ADD COLUMN `ai_generation_model` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `UserAiCredential` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `provider` ENUM('groq', 'anthropic', 'google', 'openai', 'custom') NOT NULL,
    `label` VARCHAR(191) NULL,
    `api_key_enc` TEXT NOT NULL,
    `base_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserAiCredential_user_id_provider_key`(`user_id`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserAiCredential` ADD CONSTRAINT `UserAiCredential_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
