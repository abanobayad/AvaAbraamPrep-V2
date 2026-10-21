-- A meeting becomes a recurring definition (weekly day + time, or daily with a per-day schedule)
ALTER TABLE `Meeting`
    ADD COLUMN `frequency` VARCHAR(191) NOT NULL DEFAULT 'weekly',
    ADD COLUMN `day` VARCHAR(191) NULL,
    ADD COLUMN `startTime` VARCHAR(191) NULL,
    ADD COLUMN `endTime` VARCHAR(191) NULL,
    ADD COLUMN `schedule` TEXT NULL;

-- CreateTable
CREATE TABLE `MeetingSession` (
    `id` VARCHAR(191) NOT NULL,
    `meetingId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MeetingSession_date_idx`(`date`),
    UNIQUE INDEX `MeetingSession_meetingId_date_key`(`meetingId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Existing meetings were single-date: each becomes one session held on that date,
-- and a weekly meeting on that weekday
INSERT INTO `MeetingSession` (`id`, `meetingId`, `date`, `createdBy`, `createdAt`)
SELECT CONCAT('ms_', `id`), `id`, DATE(`date`), `createdBy`, `createdAt` FROM `Meeting`;

UPDATE `Meeting` SET `day` = DAYNAME(`date`);

-- Attendance rows move from the meeting to its session
ALTER TABLE `MeetingAttendance` ADD COLUMN `sessionId` VARCHAR(191) NULL;

UPDATE `MeetingAttendance` SET `sessionId` = CONCAT('ms_', `meetingId`);

ALTER TABLE `MeetingAttendance` DROP FOREIGN KEY `MeetingAttendance_meetingId_fkey`;

DROP INDEX `MeetingAttendance_meetingId_studentId_key` ON `MeetingAttendance`;

ALTER TABLE `MeetingAttendance` DROP COLUMN `meetingId`, MODIFY `sessionId` VARCHAR(191) NOT NULL;

CREATE UNIQUE INDEX `MeetingAttendance_sessionId_studentId_key` ON `MeetingAttendance`(`sessionId`, `studentId`);

-- AddForeignKey
ALTER TABLE `MeetingSession` ADD CONSTRAINT `MeetingSession_meetingId_fkey` FOREIGN KEY (`meetingId`) REFERENCES `Meeting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MeetingAttendance` ADD CONSTRAINT `MeetingAttendance_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `MeetingSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- The meeting itself no longer carries a date
DROP INDEX `Meeting_date_idx` ON `Meeting`;

ALTER TABLE `Meeting` DROP COLUMN `date`;
