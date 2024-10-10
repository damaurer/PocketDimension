-- CreateTable
CREATE TABLE IF NOT EXISTS  "User" (
    "email" TEXT NOT NULL PRIMARY KEY,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS  "V_User_Role" (
    "roleName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,

    PRIMARY KEY ("userEmail", "roleName"),
    CONSTRAINT "V_User_Role_userEmail_fkey" FOREIGN KEY ("userEmail") REFERENCES "User" ("email") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS  "Role" (
    "name" TEXT NOT NULL PRIMARY KEY
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");


-- InsertRole
INSERT OR IGNORE INTO "Role" (name) values ('ADMINISTRATOR_ROLE');
INSERT OR IGNORE INTO "Role" (name) values ('USER_ROLE');