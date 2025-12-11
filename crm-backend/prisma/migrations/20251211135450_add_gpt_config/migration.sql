-- CreateTable
CREATE TABLE `GptConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `apiKey` VARCHAR(191) NOT NULL,
    `baseUrl` VARCHAR(191) NOT NULL DEFAULT 'https://api.openai.com/v1',
    `model` VARCHAR(191) NOT NULL DEFAULT 'gpt-4.1-mini',
    `temperature` DOUBLE NOT NULL DEFAULT 0.3,
    `systemPrompt` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
