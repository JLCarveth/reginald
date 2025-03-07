---
title: Implementing Role-based Access Control (RBAC) with Express.js and SQLite
publish_date: 2022-09-08
author: John L. Carveth
---
Role-based access control (RBAC) is a valuable technique for restricting access to computer resources based on a user's role within that system. Imagine an organization with multiple departments. An employee who works in shipping and recieving will need access to a "Shipping" view in an application, but has no need to access the "Expense Reports" view. RBAC facilitates rules such as this through the concept of "roles" and "permissions".

This article will cover how to implement RBAC using a backend API built with the Node.js package `express.js` and SQLite as a database. However the concepts presented here can be implemented with your preffered technology stack. For our SQLite implementation, we will need four tables, their schemas described below:

```SQL
CREATE TABLE IF NOT EXISTS permissions \
 (id integer primary key not null,\
      permName text unique not null,\
      dateCreated text default CURRENT_TIMESTAMP,\
      dateUpdated text default CURRENT_TIMESTAMP)

CREATE TABLE IF NOT EXISTS roles \
  (id integer primary key not null,\
      roleName text unique not null,\
      dateCreated text default CURRENT_TIMESTAMP,\
      dateUpdated text default CURRENT_TIMESTAMP)

CREATE TABLE IF NOT EXISTS rolePerms \
  (dateCreated text default CURRENT_TIMESTAMP,\
      dateUpdated text default CURRENT_TIMESTAMP,\
      roleID integer not null,\
      permID integer not null,\
      FOREIGN KEY(roleID) REFERENCES roles(id),\
      FOREIGN KEY (permID) REFERENCES permissions(id))

CREATE TABLE IF NOT EXISTS userRoles \
  (userID integer not null,\
      roleID integer not null,\
      FOREIGN KEY (userID) REFERENCES users(rowid),\
      FOREIGN KEY (roleID) REFERENCES roles(id))
```

The relations between the above data should be easy to see; there exist `roles` and `permissions`, each described by an `id` and a `name` (though since our `name` field is unique, we could go and omit the ID). `rolePerms` maps created permissions to roles, whereas the `userRoles` table contains all role assignments for our users.

Now that we have our tables defined, let's add some default roles:
```Javascript
let CREATE_ROLES = 'INSERT OR IGNORE INTO roles (roleName) VALUES ('admin', 'default')';
```
Of course, you could instead read some default roles from a config file or environment variables, but these two static roles will do for now. The `INSERT OR IGNORE` query will ensure that the roles will only be created once, no matter how many times our backend service starts or stops.

Now that we have some roles created, let's create some database triggers. Triggers are actions that are performed automatically by our database system--in this case, SQLite--whenever a specified event occurs. We need three triggers. The first trigger automatically inserts an entry into the `rolePerms` table whenever a new `permission` is created, the second trigger deletes that record whenever the `permissions` record is deleted. This allows for our `admin` role to always have every permission in the system. The final trigger assigns the `default` role to all newly created users.
```Javascript
let ADMIN_ASSIGN_TRIGGER = 'CREATE TRIGGER IF NOT EXISTS admin_role_trg AFTER INSERT ON permissions BEGIN INSERT INTO rolePerms (roleID, permID) VALUES ((SELECT id FROM roles WHERE roleName = "admin"), NEW.id); END;';

let ADMIN_REVOKE_TRIGGER = 'CREATE TRIGGER IF NOT EXISTS admin_revoke_trg BEFORE DELETE ON permissions BEGIN DELETE FROM rolePerms WHERE roleID = OLD.rowid; END;';

let USER_ROLE_TRIGGER = 'CREATE TRIGGER IF NOT EXISTS user_role_trg AFTER INSERT ON users BEGIN INSERT INTO userRoles (userID, roleID) VALUES (NEW.rowid, (SELECT id FROM roles WHERE roleName = "default")); END;';
```

Now that our database is properly established, we can create some functions which add our RBAC functionality. Since I was implementing RBAC into an existing Node.js project, I already had a `login` function which queried the SQLite DB. This was a very simple query:
```SQL
SELECT users.rowid, users.* FROM users WHERE email = ?;
```
This SQL query was wrapped in a `login()` function, and called from an express route which returns a token along with the user's details. With our new RBAC system, we want to store the user's role info. We can update our query to fetch roles the user has as well:  
```SQL
SELECT users.rowid, users.*, userRoles.*, roles.roleName FROM users INNER JOIN roles INNER JOIN userRoles ON users.rowid = userRoles.userID AND roles.id=userRoles.roleID WHERE email = ?
``` 
Of course, I am no SQL expert, so this query isn't ideal. It returns multiple rows, one for each role assigned to the user. However it is trivial to collect each role name into an array. We can then generate a token and pass off the login information back to the client.  

```Javascript
let token = await generateToken({
    'id' : result.rowid,
    'email' : result.email,
    'user' : result.user,
    'roles' : roles
});

return {
    'token' : token,
    'id' : result.rowid,
    'email' : result.email,
    'user' : result.user
}
```
We will also need a couple of other functions in our database service class. Namely, we need functions to create and delete roles and permissions, and to create and delete associations with the proper tables `rolePerms` and `userRoles`. The implementation of these functions is straightforward and won't be covered in this blog post. 

The final feature I'd like to implement is an `express.js` middleware that protects routes by requiring a certain permission. Implementing this will actually require *two* middlewares. The first, which we'll call `AuthWare` will check the header of an incoming response for a token. `AuthWare` verifies the token, and if valid, will store the token contents (including roles) within the `res.locals` variable.

The second middleware, `RoleWare`, will be created dynamically. On an incoming request, `RoleWare` will check `res.locals` for the user's roles, and will see if any of those roles have been granted the needed permission.

`AuthWare.js`:
```Javascript
function middleware(req, res, next) {
    const token = request.headers['x-access-token'];
    if (token) {
        try {
            let result = verifyToken(token);
            res.locals.email = result.email;
            res.locals.roles = result.roles;
            return next();
        } catch (err) {
            res.status(401).send({'success' : false, 'message' : 'Invalid token'.});
        }
    } else {
        res.status(401).send({'success' : false, 'message' : 'No token provided.'});
    }
}
```

`RoleWare.js`
```Javascript
export default class RoleWare {
    constructor(permission, roles) {
        this.roles = roles; // {"admin" : ["perm1", "perm2"], "default" : ["view"]}
        this.permission = permission;
        let that = this;
        return function (req, res, next) {
            let roles = res.locals.roles;
            let valid = false;
            for (let role of roles) {
                if (that.validate(role)) { // validate() simply calls this.roles[role].includes()
                    valid = true;
                }
            }
            if (valid) next();
            else {
                res.send({
                    'success' : false,
                    'message' : 'Insufficient permissions'
                });
            }
        }
    }
}
```

An important distinction is that `AuthWare` handles *authenticating* the user, whereas `RoleWare` is concerned with whether the user is *authorized* to access the requested resource.

`AuthWare` can be applied to a route to protect certain routes:
```Javascript
app.use('/api/route/', middleware);
```
Applying `RoleWare` to a route is almost as simple, though it must be added **after** `AuthWare`, since `RoleWare` depends upon values created by `AuthWare`.
```Javascript
app.use('/api/users/count', new RoleWare('countUsers', roleObj));
```
Now we have a working database schema, we properly handle user roles, and we have middlewares to enforce authentication and authorization. The one drawback of this approach is that once a `RoleWare` object is created, it's `roleObj` (the in-memory mapping of roles to permissions) will remain the same throughout the object lifetime. If a role is granted a new permission during runtime, `RoleWare` will not be aware of such a change. Also, since the roles are encoded within the token, the user will need to re-authenticate if they are assigned a role during runtime. Though for my usecases, these two issues aren't a major problem. 

To see a similarly-styled RBAC implementation in a real codebase, check out [JLCarveth/nodeblog](https://github.com/JLCarveth/nodeblog).
