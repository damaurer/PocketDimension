

export const SELECT_USER_ROLE = `
    SELECT User.id,
           User.name,
           User.email,
           User.password,
           User.updatedAt,
           User.createdAt,
           GROUP_CONCAT(V_User_Role.role_name) AS roles
    FROM User
             LEFT JOIN V_User_Role ON User.id = V_User_Role.user_id`;

export const SELECT_USER_GROUP_BY = 'GROUP BY User.id';