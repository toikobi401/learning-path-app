-- CreateTable
CREATE TABLE `TopicLesson` (
    `id` VARCHAR(191) NOT NULL,
    `topic_id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TopicLesson_topic_id_key`(`topic_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TopicLesson` ADD CONSTRAINT `TopicLesson_topic_id_fkey` FOREIGN KEY (`topic_id`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
