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
-- Game catalog: one row per game a server can be created from.
-- ports, env and volumes are JSON, see src/lib/games/types.ts.
CREATE TABLE IF NOT EXISTS "GameTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL,
    "ports" TEXT NOT NULL DEFAULT '[]',
    "env" TEXT NOT NULL DEFAULT '[]',
    "volumes" TEXT NOT NULL DEFAULT '[]',
    "memoryMb" INTEGER,
    "query" TEXT,
    "docsUrl" TEXT,
    "builtin" INTEGER NOT NULL DEFAULT 0,
    "catalogVersion" INTEGER,
    "enabled" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- A game server owned by a user, backed by one Docker container.
CREATE TABLE IF NOT EXISTS "GameServer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
    "templateId" INTEGER NOT NULL REFERENCES "GameTemplate" ("id") ON DELETE RESTRICT,
    "containerId" TEXT,
    "portOffset" INTEGER NOT NULL DEFAULT 0,
    "env" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "statusMessage" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "GameServer_ownerId" ON "GameServer"("ownerId");
