-- AlterTable
ALTER TABLE `deal` ADD COLUMN `approvalRejectReason` VARCHAR(500) NULL,
    ADD COLUMN `approvalRequestedAt` DATETIME(3) NULL,
    ADD COLUMN `approvalRequestedById` INTEGER NULL,
    ADD COLUMN `approvalReviewedAt` DATETIME(3) NULL,
    ADD COLUMN `approvalReviewedById` INTEGER NULL;
