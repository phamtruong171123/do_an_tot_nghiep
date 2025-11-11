/*
  Warnings:

  - You are about to drop the `usersession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `usersession` DROP FOREIGN KEY `UserSession_userId_fkey`;

-- DropTable
DROP TABLE `usersession`;
