-- AlterTable: cấu hình Pomodoro + tùy chọn leaderboard cho UserSettings
ALTER TABLE `UserSettings`
    ADD COLUMN `pomodoro_focus_min` INTEGER NOT NULL DEFAULT 25,
    ADD COLUMN `pomodoro_break_min` INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN `pomodoro_long_break_min` INTEGER NOT NULL DEFAULT 15,
    ADD COLUMN `pomodoro_rounds` INTEGER NOT NULL DEFAULT 4,
    ADD COLUMN `leaderboard_opt_in` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `StudySession` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `goal_id` VARCHAR(191) NULL,
    `minutes` INTEGER NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'pomodoro',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StudySession_user_id_idx`(`user_id`),
    INDEX `StudySession_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StudySession` ADD CONSTRAINT `StudySession_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
