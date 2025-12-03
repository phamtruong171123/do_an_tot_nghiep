-- CreateTable
CREATE TABLE `Deal` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `stage` ENUM('POTENTIAL', 'CONTACTED', 'NEGOTIATION', 'CONTRACT', 'LOST') NOT NULL DEFAULT 'POTENTIAL',
    `amount` DOUBLE NULL,
    `currency` VARCHAR(191) NULL,
    `appointmentAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `customerId` INTEGER NOT NULL,
    `ownerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Deal_code_key`(`code`),
    INDEX `Deal_customerId_idx`(`customerId`),
    INDEX `Deal_ownerId_idx`(`ownerId`),
    INDEX `Deal_stage_idx`(`stage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DealActivity` (
    `id` VARCHAR(191) NOT NULL,
    `dealId` VARCHAR(191) NOT NULL,
    `authorId` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `activityAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DealActivity_dealId_idx`(`dealId`),
    INDEX `DealActivity_authorId_idx`(`authorId`),
    INDEX `DealActivity_activityAt_idx`(`activityAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Deal` ADD CONSTRAINT `Deal_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Deal` ADD CONSTRAINT `Deal_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DealActivity` ADD CONSTRAINT `DealActivity_dealId_fkey` FOREIGN KEY (`dealId`) REFERENCES `Deal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DealActivity` ADD CONSTRAINT `DealActivity_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
