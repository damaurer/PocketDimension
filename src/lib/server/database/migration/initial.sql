-- CreateTable
CREATE TABLE IF NOT EXISTS  "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS  "V_User_Role" (
    "role_name" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    PRIMARY KEY ("user_id", "role_name"),
    CONSTRAINT "V_User_Role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS  "Role" (
    "name" TEXT NOT NULL PRIMARY KEY
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_id_key" ON "User"("id");


-- InsertRole
INSERT OR IGNORE INTO "Role" (name) values ('ADMINISTRATOR_ROLE');
INSERT OR IGNORE INTO "Role" (name) values ('USER_ROLE');