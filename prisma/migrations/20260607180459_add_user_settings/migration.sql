/*
  Warnings:

  - You are about to drop the `Quiz` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuizAttempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuizQuestion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Quiz` DROP FOREIGN KEY `Quiz_topic_id_fkey`;

-- DropForeignKey
ALTER TABLE `QuizAttempt` DROP FOREIGN KEY `QuizAttempt_quiz_id_fkey`;

-- DropForeignKey
ALTER TABLE `QuizAttempt` DROP FOREIGN KEY `QuizAttempt_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `QuizQuestion` DROP FOREIGN KEY `QuizQuestion_quiz_id_fkey`;

-- AlterTable
ALTER TABLE `ChatMessage` ADD COLUMN `conversation_id` VARCHAR(191) NULL,
    MODIFY `goal_id` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `Quiz`;

-- DropTable
DROP TABLE `QuizAttempt`;

-- DropTable
DROP TABLE `QuizQuestion`;

-- CreateTable
CREATE TABLE `UserSettings` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `ui_language` VARCHAR(191) NOT NULL DEFAULT 'vi',
    `ai_language` VARCHAR(191) NOT NULL DEFAULT 'vi',
    `show_chat_widget` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserSettings_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conversation` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `goal_id` VARCHAR(191) NULL,
    `title` VARCHAR(255) NOT NULL DEFAULT 'New conversation',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Conversation_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhaseQuiz` (
    `id` VARCHAR(191) NOT NULL,
    `phase_id` VARCHAR(191) NOT NULL,
    `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PhaseQuiz_phase_id_key`(`phase_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhaseQuizQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `quiz_id` VARCHAR(191) NOT NULL,
    `type` ENUM('mcq', 'essay') NOT NULL,
    `question` TEXT NOT NULL,
    `options` JSON NULL,
    `correct_index` INTEGER NULL,
    `model_answer` TEXT NULL,
    `explanation` TEXT NULL,
    `order_index` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhaseQuizAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `quiz_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `answers` JSON NOT NULL,
    `score` DOUBLE NOT NULL,
    `ai_feedback` JSON NOT NULL,
    `completed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PracticeAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `phase_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL,
    `question_count` INTEGER NOT NULL,
    `question_types` JSON NOT NULL,
    `score` DOUBLE NOT NULL,
    `ai_feedback` JSON NOT NULL,
    `completed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ChatMessage_conversation_id_idx` ON `ChatMessage`(`conversation_id`);

-- AddForeignKey
ALTER TABLE `UserSettings` ADD CONSTRAINT `UserSettings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_goal_id_fkey` FOREIGN KEY (`goal_id`) REFERENCES `Goal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhaseQuiz` ADD CONSTRAINT `PhaseQuiz_phase_id_fkey` FOREIGN KEY (`phase_id`) REFERENCES `Phase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhaseQuizQuestion` ADD CONSTRAINT `PhaseQuizQuestion_quiz_id_fkey` FOREIGN KEY (`quiz_id`) REFERENCES `PhaseQuiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhaseQuizAttempt` ADD CONSTRAINT `PhaseQuizAttempt_quiz_id_fkey` FOREIGN KEY (`quiz_id`) REFERENCES `PhaseQuiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhaseQuizAttempt` ADD CONSTRAINT `PhaseQuizAttempt_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeAttempt` ADD CONSTRAINT `PracticeAttempt_phase_id_fkey` FOREIGN KEY (`phase_id`) REFERENCES `Phase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeAttempt` ADD CONSTRAINT `PracticeAttempt_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `ChatMessage` RENAME INDEX `ChatMessage_user_id_fkey` TO `ChatMessage_user_id_idx`;
