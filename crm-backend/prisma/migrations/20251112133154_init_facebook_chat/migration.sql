-- DropIndex
DROP INDEX `Conversation_pageId_externalUserId_key` ON `conversation`;

ALTER TABLE `message` DROP FOREIGN KEY `Message_conversationId_fkey`;

-- AlterTable
ALTER TABLE `channel` DROP PRIMARY KEY,
    ADD COLUMN `pageName` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `conversation` DROP PRIMARY KEY,
    DROP COLUMN `channelType`,
    DROP COLUMN `pageId`,
    ADD COLUMN `assignedAt` DATETIME(3) NULL,
    ADD COLUMN `assigneeId` INTEGER NULL,
    ADD COLUMN `channelId` VARCHAR(191) NOT NULL,
    ADD COLUMN `lastMessageText` VARCHAR(191) NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `message` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- CreateIndex
CREATE INDEX `Conversation_assigneeId_idx` ON `Conversation`(`assigneeId`);

-- CreateIndex
CREATE UNIQUE INDEX `Conversation_channelId_externalUserId_key`
  ON `Conversation`(`channelId`, `externalUserId`);

-- AddForeignKey
ALTER TABLE `Conversation`
  ADD CONSTRAINT `Conversation_channelId_fkey`
  FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation`
  ADD CONSTRAINT `Conversation_assigneeId_fkey`
  FOREIGN KEY (`assigneeId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 🔥 1) ADD LẠI foreign key message.conversationId -> conversation.id
ALTER TABLE `message`
  ADD CONSTRAINT `Message_conversationId_fkey`
  FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;