const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

app.use(cors());
app.use(express.json());

io.on("connection", (socket) => {
  console.log("A user connected via socket:", socket.id);

  socket.on("join_user", (userId) => {
    socket.join("user_" + userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on("join_client", (clientId) => {
    socket.join("client_" + clientId);
    console.log(`Client ${clientId} joined room`);
  });

  socket.on("join_project", (projectId) => {
    socket.join("project_" + projectId);
    console.log(`Project ${projectId} joined room`);
  });

  socket.on("join_admin", () => {
    socket.join("admins");
    console.log("Admin joined room");
  });

  socket.on("start_meeting", ({ projectId, projectTitle, roomName, senderName, senderType }) => {
    db.query("SELECT user_id, client_id FROM projects WHERE id = ?", [projectId], (err, results) => {
      if (!err && results && results.length > 0) {
        const { user_id, client_id } = results[0];
        socket.to("project_" + projectId).emit("meeting_started", { projectId, projectTitle, roomName, senderName, senderType });
        if (senderType === 'client') {
          // Notify project owner
          socket.to("user_" + user_id).emit("meeting_started", { projectId, projectTitle, roomName, senderName, senderType });
          // Notify assigned team members
          db.query("SELECT user_id FROM project_assignments WHERE project_id = ?", [projectId], (err2, assignRes) => {
            if (!err2 && assignRes) {
              assignRes.forEach(row => {
                socket.to("user_" + row.user_id).emit("meeting_started", { projectId, projectTitle, roomName, senderName, senderType });
              });
            }
          });
        } else {
          // Freelancer (owner or team member) started meeting
          // Notify client
          socket.to("client_" + client_id).emit("meeting_started", { projectId, projectTitle, roomName, senderName, senderType });
          // Notify owner
          socket.to("user_" + user_id).emit("meeting_started", { projectId, projectTitle, roomName, senderName, senderType });
          // Notify other assigned team members
          db.query("SELECT user_id FROM project_assignments WHERE project_id = ?", [projectId], (err2, assignRes) => {
            if (!err2 && assignRes) {
              assignRes.forEach(row => {
                socket.to("user_" + row.user_id).emit("meeting_started", { projectId, projectTitle, roomName, senderName, senderType });
              });
            }
          });
        }
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Setup uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// ================================
// PLAN LIMITS CONFIG
// ================================
const PLAN_LIMITS = {
  Starter: { maxProjects: 3, maxClients: 3, maxFiles: 3, realtime: false, analytics: false, invoiceTracking: false, videoCall: false },
  Pro: { maxProjects: 20, maxClients: 20, maxFiles: 50, realtime: true, analytics: true, invoiceTracking: true, videoCall: true },
  Agency: { maxProjects: 9999, maxClients: 9999, maxFiles: 999, realtime: true, analytics: true, invoiceTracking: true, videoCall: true }
};
const getPlanLimits = (plan) => PLAN_LIMITS[plan] || PLAN_LIMITS['Starter'];

app.get("/", (req, res) => {
  res.send("GridLancer API Running...");
});


const runMigrations = () => {
  // Check users table columns
  db.query("DESCRIBE users", (err, fields) => {
    if (err) {
      console.log("Error describing users table:", err);
      return;
    }
    const cols = fields.map(f => f.Field);
    if (!cols.includes('plan')) {
      db.query("ALTER TABLE users ADD COLUMN plan VARCHAR(50) DEFAULT 'Starter'", (err) => {
        if (err) console.log("Error adding plan column:", err);
        else console.log("Added 'plan' column to users.");
      });
    }
    if (!cols.includes('status')) {
      db.query("ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active'", (err) => {
        if (err) console.log("Error adding status column:", err);
        else console.log("Added 'status' column to users.");
      });
    }
    if (!cols.includes('banned_until')) {
      db.query("ALTER TABLE users ADD COLUMN banned_until DATETIME DEFAULT NULL", (err) => {
        if (err) console.log("Error adding banned_until column:", err);
        else console.log("Added 'banned_until' column to users.");
      });
    }
    if (!cols.includes('unban_requested')) {
      db.query("ALTER TABLE users ADD COLUMN unban_requested TINYINT DEFAULT 0", (err) => {
        if (err) console.log("Error adding unban_requested column to users:", err);
        else console.log("Added 'unban_requested' column to users.");
      });
    }
    if (!cols.includes('ban_reason')) {
      db.query("ALTER TABLE users ADD COLUMN ban_reason VARCHAR(255) DEFAULT NULL", (err) => {
        if (err) console.log("Error adding ban_reason column to users:", err);
        else console.log("Added 'ban_reason' column to users.");
      });
    }
    if (!cols.includes('role')) {
      db.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'owner'", (err) => {
        if (err) console.log("Error adding role column to users:", err);
        else console.log("Added 'role' column to users.");
      });
    }
  });

  // Check clients table columns
  db.query("DESCRIBE clients", (err, fields) => {
    if (err) {
      console.log("Error describing clients table:", err);
      return;
    }
    const cols = fields.map(f => f.Field);
    if (!cols.includes('status')) {
      db.query("ALTER TABLE clients ADD COLUMN status VARCHAR(50) DEFAULT 'active'", (err) => {
        if (err) console.log("Error adding status column to clients:", err);
        else console.log("Added 'status' column to clients.");
      });
    }
    if (!cols.includes('banned_until')) {
      db.query("ALTER TABLE clients ADD COLUMN banned_until DATETIME DEFAULT NULL", (err) => {
        if (err) console.log("Error adding banned_until column to clients:", err);
        else console.log("Added 'banned_until' column to clients.");
      });
    }
    if (!cols.includes('unban_requested')) {
      db.query("ALTER TABLE clients ADD COLUMN unban_requested TINYINT DEFAULT 0", (err) => {
        if (err) console.log("Error adding unban_requested column to clients:", err);
        else console.log("Added 'unban_requested' column to clients.");
      });
    }
  });

  // Create tables
  db.query(`CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    \`key\` VARCHAR(100) UNIQUE NOT NULL,
    \`value\` TEXT NOT NULL
  )`, (err) => {
    if (err) console.log("Error creating system_settings table:", err);
    else {
      db.query(`INSERT IGNORE INTO system_settings (\`key\`, \`value\`) VALUES ('admin_bank_account', '1234-5678-9012-3456 (GridLancer Main Bank)')`, () => { });
    }
  });

  db.query(`CREATE TABLE IF NOT EXISTS upgrade_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    requested_plan VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    payment_status VARCHAR(50) DEFAULT 'Unpaid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.log("Error creating upgrade_requests table:", err);
  });

  db.query(`CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    activity_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.log("Error creating activity_log table:", err);
  });

  db.query(`CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    freelancer_id INT NOT NULL,
    project_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    admin_response TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.log("Error creating complaints table:", err);
    else {
      db.query("DESCRIBE complaints", (err, fields) => {
        if (err) {
          console.log("Error describing complaints table:", err);
          return;
        }
        const cols = fields.map(f => f.Field);
        if (!cols.includes('admin_response')) {
          db.query("ALTER TABLE complaints ADD COLUMN admin_response TEXT DEFAULT NULL", (err) => {
            if (err) console.log("Error adding admin_response to complaints:", err);
            else console.log("Added 'admin_response' column to complaints.");
          });
        }
      });
    }
  });

  // Create Agency Team Tables
  db.query(`CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.log("Error creating teams table:", err);
  });

  db.query(`CREATE TABLE IF NOT EXISTS team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.log("Error creating team_members table:", err);
  });

  db.query(`CREATE TABLE IF NOT EXISTS project_assignments (
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.log("Error creating project_assignments table:", err);
  });
};

db.connect((err) => {
  if (err) {
    console.log("DB connection error:", err);
  } else {
    console.log("MySQL Connected...");
    runMigrations();
  }
});

// Helper: Get Agency Owner ID for a user
const getAgencyOwnerId = (userId) => {
  return new Promise((resolve) => {
    db.query("SELECT role FROM users WHERE id = ?", [userId], (err, rows) => {
      if (err || rows.length === 0) return resolve(userId);
      const role = rows[0].role;
      if (role === 'admin' || role === 'member') {
        db.query(
          "SELECT t.owner_id FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.user_id = ?",
          [userId],
          (err2, tmRows) => {
            if (err2 || tmRows.length === 0) return resolve(userId);
            resolve(tmRows[0].owner_id);
          }
        );
      } else {
        resolve(userId);
      }
    });
  });
};

// REGISTER API
app.post("/api/register", async (req, res) => {
  const { name, email, password, plan } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userPlan = (plan === 'Pro' || plan === 'Agency') ? plan : 'Starter';

    const sql = "INSERT INTO users (name, email, password, plan, role) VALUES (?, ?, ?, ?, 'owner')";

    db.query(sql, [name, email, hashedPassword, userPlan], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Error registering user" });
      }

      res.json({
        message: "User registered successfully",
        user: {
          id: result.insertId,
          name: name,
          email: email,
          plan: userPlan,
          role: 'owner'
        }
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN API
app.post("/api/login", (req, res) => {
  const { email, password, plan } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    if (result.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result[0];

    // Ban check
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      return res.status(403).json({
        message: `Your account is temporarily banned until ${new Date(user.banned_until).toLocaleString()}.`,
        banned: true,
        userId: user.id,
        bannedUntil: user.banned_until,
        unbanRequested: user.unban_requested === 1
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      "secretkey",
      { expiresIn: "7d" }
    );

    const targetPlan = (plan === 'Pro' || plan === 'Agency') ? plan : null;

    if (targetPlan && user.plan !== targetPlan) {
      db.query("UPDATE users SET plan = ? WHERE id = ?", [targetPlan, user.id], (updErr) => {
        if (updErr) {
          console.log("Error updating plan on login:", updErr);
        }
        res.json({
          message: "Login successful",
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image || null,
            plan: targetPlan,
            role: user.role || "owner"
          },
        });
      });
    } else {
      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image || null,
          plan: user.plan || "Starter",
          role: user.role || "owner"
        },
      });
    }
  });
});

// UPDATE USER API
app.put("/api/users/:id", async (req, res) => {
  const userId = req.params.id;
  const { name, email, password, image } = req.body;

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = "UPDATE users SET name = ?, email = ?, password = ?, image = ? WHERE id = ?";
      db.query(sql, [name, email, hashedPassword, image, userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Error updating user" });
        res.json({ message: "User updated successfully" });
      });
    } else {
      const sql = "UPDATE users SET name = ?, email = ?, image = ? WHERE id = ?";
      db.query(sql, [name, email, image, userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Error updating user" });
        res.json({ message: "User updated successfully" });
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/clients", async (req, res) => {
  const { user_id, name, email, password } = req.body;
  const ownerId = await getAgencyOwnerId(user_id);

  db.query("SELECT role FROM users WHERE id = ?", [user_id], async (err, uRows) => {
    if (err || uRows.length === 0) return res.status(500).json({ message: "User not found" });
    const role = uRows[0].role;
    if (role === 'member') {
      return res.status(403).json({ message: "Members cannot add clients. Only Owners and Admins can." });
    }

    // Plan limit check
    const userPlanRows = await new Promise(resolve => db.query("SELECT plan FROM users WHERE id = ?", [ownerId], (e, r) => resolve(r || [])));
    if (userPlanRows.length > 0) {
      const limits = getPlanLimits(userPlanRows[0].plan);
      const countRows = await new Promise(resolve => db.query("SELECT COUNT(*) as cnt FROM clients WHERE user_id = ?", [ownerId], (e, r) => resolve(r || [])));
      if (countRows[0] && countRows[0].cnt >= limits.maxClients) {
        return res.status(403).json({
          message: `Your ${userPlanRows[0].plan || 'Starter'} plan allows a maximum of ${limits.maxClients} clients. Upgrade to add more.`,
          upgrade: true,
          requiredPlan: userPlanRows[0].plan === 'Starter' ? 'Pro' : 'Agency',
          limit: limits.maxClients
        });
      }
    }

    const checkSql = "SELECT * FROM clients WHERE email = ?";
    db.query(checkSql, [email], async (err, result) => {
      if (err) return res.status(500).json({ message: "Error checking client" });

      if (result.length > 0) {
        return res.json({
          message: "Client already exists, linked successfully",
          clientId: result[0].id,
        });
      }

      try {
        const hashedPassword = await bcrypt.hash(password || "", 10);
        const sql = `
          INSERT INTO clients (user_id, name, email, password)
          VALUES (?, ?, ?, ?)
        `;

        db.query(sql, [ownerId, name, email, hashedPassword], (err, insertResult) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ message: "Error creating client" });
          }

          res.json({
            message: "Client created successfully",
            clientId: insertResult.insertId,
          });
        });
      } catch (hashErr) {
        console.log(hashErr);
        return res.status(500).json({ message: "Server error during client creation" });
      }
    });
  });
});

app.put("/api/clients/:id", async (req, res) => {
  const clientId = req.params.id;
  const { name, email, password, image } = req.body;

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = "UPDATE clients SET name = ?, email = ?, password = ?, image = ? WHERE id = ?";
      db.query(sql, [name, email, hashedPassword, image, clientId], (err, result) => {
        if (err) return res.status(500).json({ message: "Error updating client" });
        res.json({ message: "Client updated successfully" });
      });
    } else {
      const sql = "UPDATE clients SET name = ?, email = ?, image = ? WHERE id = ?";
      db.query(sql, [name, email, image, clientId], (err, result) => {
        if (err) return res.status(500).json({ message: "Error updating client" });
        res.json({ message: "Client updated successfully" });
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/projects", async (req, res) => {
  const { user_id, client_id, title, description, deadline, assignedTo } = req.body;
  const ownerId = await getAgencyOwnerId(user_id);

  db.query("SELECT role FROM users WHERE id = ?", [user_id], (err, uRows) => {
    if (err || uRows.length === 0) return res.status(500).json({ message: "User not found" });
    const role = uRows[0].role;
    if (role === 'member') {
      return res.status(403).json({ message: "Members cannot create projects." });
    }

    db.query("SELECT plan FROM users WHERE id = ?", [ownerId], (err, userRows) => {
      if (err || userRows.length === 0) return res.status(500).json({ message: "User not found" });
      const limits = getPlanLimits(userRows[0].plan);
      db.query("SELECT COUNT(*) as cnt FROM projects WHERE user_id = ?", [ownerId], (err, countRows) => {
        if (err) return res.status(500).json({ message: "Error checking project count" });
        const projectCount = countRows[0].cnt;
        if (projectCount >= limits.maxProjects) {
          return res.status(403).json({
            message: `Your ${userRows[0].plan || 'Starter'} plan allows a maximum of ${limits.maxProjects} projects. Upgrade to add more.`,
            upgrade: true,
            requiredPlan: userRows[0].plan === 'Starter' ? 'Pro' : 'Agency',
            limit: limits.maxProjects
          });
        }

        const sql = `
          INSERT INTO projects (user_id, client_id, title, description, deadline)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.query(sql, [ownerId, client_id, title, description, deadline || null], (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ message: "Error creating project" });
          }

          const projectId = result.insertId;

          // Insert team assignments if any
          if (Array.isArray(assignedTo) && assignedTo.length > 0) {
            const assignmentValues = assignedTo.map(uid => [projectId, uid]);
            db.query("INSERT INTO project_assignments (project_id, user_id) VALUES ?", [assignmentValues], (assignErr) => {
              if (assignErr) console.log("Error inserting project assignments:", assignErr);
            });
          }

          // Insert default weighted tasks
          const defaultTasks = [
            [projectId, 'Design', 20],
            [projectId, 'Development', 50],
            [projectId, 'Testing', 20],
            [projectId, 'Deployment', 10]
          ];

          const taskSql = "INSERT INTO project_tasks (project_id, title, weight) VALUES ?";
          db.query(taskSql, [defaultTasks], (taskErr) => {
            if (taskErr) console.log("Error inserting default tasks", taskErr);

            // Emit real-time project list updates
            io.to("user_" + ownerId).emit("project_list_updated");
            if (Array.isArray(assignedTo)) {
              assignedTo.forEach(uid => {
                io.to("user_" + uid).emit("project_list_updated");
              });
            }
            io.to("client_" + client_id).emit("project_list_updated");
            io.to("admins").emit("refresh_admin_dashboard");

            res.json({
              message: "Project created successfully",
              projectId: projectId,
            });
          });
        });
      });
    });
  });
});

app.get("/api/clients/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  const ownerId = await getAgencyOwnerId(user_id);

  db.query("SELECT role FROM users WHERE id = ?", [user_id], (err, userRows) => {
    if (err || userRows.length === 0) return res.status(500).json({ message: "Error fetching user role" });
    const role = userRows[0].role;
    
    if (role === 'member') {
      // Fetch only clients that have projects assigned to this user
      const sql = `
        SELECT DISTINCT c.* FROM clients c
        JOIN projects p ON c.id = p.client_id
        JOIN project_assignments pa ON p.id = pa.project_id
        WHERE pa.user_id = ? AND c.user_id = ?
      `;
      db.query(sql, [user_id, ownerId], (err2, result) => {
        if (err2) return res.status(500).json({ message: "Error fetching clients" });
        res.json(result);
      });
    } else {
      // Owner / Admin sees all clients under the agency
      const sql = "SELECT * FROM clients WHERE user_id = ?";
      db.query(sql, [ownerId], (err2, result) => {
        if (err2) return res.status(500).json({ message: "Error fetching clients" });
        res.json(result);
      });
    }
  });
});

app.get("/api/projects/:client_id", (req, res) => {
  const client_id = req.params.client_id;
  const userId = req.query.userId;

  if (userId) {
    db.query("SELECT role FROM users WHERE id = ?", [userId], (err, uRows) => {
      if (!err && uRows.length > 0 && uRows[0].role === 'member') {
        const sql = `
          SELECT p.* FROM projects p
          JOIN project_assignments pa ON p.id = pa.project_id
          WHERE p.client_id = ? AND pa.user_id = ?
        `;
        db.query(sql, [client_id, userId], (err2, result) => {
          if (err2) return res.status(500).json({ message: "Error fetching projects" });
          res.json(result);
        });
      } else {
        const sql = "SELECT * FROM projects WHERE client_id = ?";
        db.query(sql, [client_id], (err2, result) => {
          if (err2) return res.status(500).json({ message: "Error fetching projects" });
          res.json(result);
        });
      }
    });
  } else {
    const sql = "SELECT * FROM projects WHERE client_id = ?";
    db.query(sql, [client_id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error fetching projects" });
      res.json(result);
    });
  }
});

// ==========================================
// TEAM COLLABORATION ENDPOINTS
// ==========================================

// Create a team
app.post("/api/teams", (req, res) => {
  const { ownerId, name } = req.body;
  if (!ownerId || !name) {
    return res.status(400).json({ message: "Owner ID and Team Name are required" });
  }

  // Check if owner already has a team
  db.query("SELECT * FROM teams WHERE owner_id = ?", [ownerId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length > 0) {
      return res.status(400).json({ message: "You already have a team created." });
    }

    db.query("INSERT INTO teams (owner_id, name) VALUES (?, ?)", [ownerId, name], (err2, result) => {
      if (err2) return res.status(500).json({ message: "Error creating team" });
      res.json({
        message: "Team created successfully",
        team: {
          id: result.insertId,
          owner_id: ownerId,
          name: name
        }
      });
    });
  });
});

// Fetch all members of a team by user id (owner, admin, or member)
app.get("/api/teams/members/:userId", (req, res) => {
  const { userId } = req.params;
  
  db.query("SELECT id FROM teams WHERE owner_id = ?", [userId], (err, teams) => {
    if (err) return res.status(500).json({ message: "Error looking up team" });
    
    let teamId = null;
    if (teams.length > 0) {
      teamId = teams[0].id;
      fetchMembersForTeam(teamId, res);
    } else {
      db.query("SELECT team_id FROM team_members WHERE user_id = ?", [userId], (err2, tmRows) => {
        if (err2) return res.status(500).json({ message: "Error looking up team members" });
        if (tmRows.length > 0) {
          teamId = tmRows[0].team_id;
          fetchMembersForTeam(teamId, res);
        } else {
          res.json({ team: null, members: [] });
        }
      });
    }
  });
  
  function fetchMembersForTeam(teamId, response) {
    db.query("SELECT * FROM teams WHERE id = ?", [teamId], (err, teamRows) => {
      if (err || teamRows.length === 0) return response.status(500).json({ message: "Error fetching team details" });
      
      const sql = `
        SELECT tm.id as assignmentId, tm.role, u.id, u.name, u.email, u.image, u.status
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = ?
      `;
      db.query(sql, [teamId], (err2, members) => {
        if (err2) return response.status(500).json({ message: "Error fetching team members" });
        
        db.query("SELECT id, name, email, image, 'owner' as role, status FROM users WHERE id = ?", [teamRows[0].owner_id], (err3, ownerRows) => {
          const owner = ownerRows.length > 0 ? ownerRows[0] : null;
          response.json({
            team: teamRows[0],
            members: owner ? [owner, ...members] : members
          });
        });
      });
    });
  }
});

// Invite a team member
app.post("/api/teams/invite", async (req, res) => {
  const { teamId, name, email, password, role } = req.body;
  if (!teamId || !name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length > 0) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userSql = "INSERT INTO users (name, email, password, plan, role) VALUES (?, ?, ?, 'Agency', ?)";
      db.query(userSql, [name, email, hashedPassword, role], (err2, result) => {
        if (err2) {
          console.log(err2);
          return res.status(500).json({ message: "Error creating user account" });
        }

        const invitedUserId = result.insertId;

        const tmSql = "INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)";
        db.query(tmSql, [teamId, invitedUserId, role], (err3) => {
          if (err3) {
            console.log(err3);
            return res.status(500).json({ message: "Error linking user to team" });
          }

          res.json({
            message: "Member invited and user account created successfully",
            user: {
              id: invitedUserId,
              name,
              email,
              role
            }
          });
        });
      });
    } catch (hashErr) {
      res.status(500).json({ message: "Server error" });
    }
  });
});

// Remove a team member
app.delete("/api/teams/members/:userId", (req, res) => {
  const { userId } = req.params;
  db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ message: "Error deleting team member" });
    res.json({ message: "Team member removed successfully" });
  });
});

// Fetch assigned project members
app.get("/api/projects/:id/assignments", (req, res) => {
  const projectId = req.params.id;
  const sql = `
    SELECT u.id, u.name, u.email, u.image, u.role
    FROM project_assignments pa
    JOIN users u ON pa.user_id = u.id
    WHERE pa.project_id = ?
  `;
  db.query(sql, [projectId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching assignments" });
    res.json(results);
  });
});

// Update project assignments
app.put("/api/projects/:id/assignments", (req, res) => {
  const projectId = req.params.id;
  const { assignedTo } = req.body;

  db.query("DELETE FROM project_assignments WHERE project_id = ?", [projectId], (err) => {
    if (err) return res.status(500).json({ message: "Error clearing assignments" });

    if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
      io.to("project_" + projectId).emit("project_details_updated");
      return res.json({ message: "Assignments updated (cleared)" });
    }

    const values = assignedTo.map(uid => [projectId, uid]);
    db.query("INSERT INTO project_assignments (project_id, user_id) VALUES ?", [values], (err2) => {
      if (err2) return res.status(500).json({ message: "Error updating assignments" });

      assignedTo.forEach(uid => {
        io.to("user_" + uid).emit("project_list_updated");
      });
      io.to("project_" + projectId).emit("project_details_updated");

      res.json({ message: "Assignments updated successfully" });
    });
  });
});

app.put("/api/projects/:id", (req, res) => {
  const projectId = req.params.id;
  const { status, progress, title, description, deadline, color } = req.body;

  let sql = "UPDATE projects SET ";
  let params = [];
  let updates = [];

  if (status !== undefined) { updates.push("status = ?"); params.push(status); }
  if (progress !== undefined) { updates.push("progress = ?"); params.push(progress); }
  if (title !== undefined) { updates.push("title = ?"); params.push(title); }
  if (description !== undefined) { updates.push("description = ?"); params.push(description); }
  if (deadline !== undefined) { updates.push("deadline = ?"); params.push(deadline || null); }
  // We can add color column if we want, but frontend uses it locally. We'll ignore color for DB if not exists.

  if (updates.length === 0) return res.json({ message: "No updates" });

  sql += updates.join(", ") + " WHERE id = ?";
  params.push(projectId);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error updating project" });
    }

    // Emit live updates
    io.to("project_" + projectId).emit("project_details_updated");
    db.query("SELECT user_id, client_id FROM projects WHERE id = ?", [projectId], (err, projData) => {
      if (!err && projData.length > 0) {
        io.to("user_" + projData[0].user_id).emit("project_list_updated");
        io.to("user_" + projData[0].user_id).emit("stats_updated");
        io.to("client_" + projData[0].client_id).emit("project_list_updated");
        io.to("client_" + projData[0].client_id).emit("stats_updated");
      }
    });
    io.to("admins").emit("refresh_admin_dashboard");

    res.json({ message: "Project updated successfully" });
  });
});

// GET invoices for a project
app.get("/api/projects/:id/invoices", (req, res) => {
  const projectId = req.params.id;
  const sql = "SELECT * FROM invoices WHERE project_id = ? ORDER BY created_at DESC";
  db.query(sql, [projectId], (err, result) => {
    if (err) return res.status(500).json({ message: "Error fetching invoices" });
    res.json(result);
  });
});

// POST invoice to a project
app.post("/api/projects/:id/invoices", (req, res) => {
  const projectId = req.params.id;
  const { title, amount } = req.body;
  const sql = "INSERT INTO invoices (project_id, title, amount) VALUES (?, ?, ?)";
  db.query(sql, [projectId, title, amount], (err, result) => {
    if (err) return res.status(500).json({ message: "Error creating invoice" });

    // Emit live update for project invoices
    io.to("project_" + projectId).emit("project_details_updated");
    db.query("SELECT user_id, client_id FROM projects WHERE id = ?", [projectId], (err, projData) => {
      if (!err && projData.length > 0) {
        io.to("user_" + projData[0].user_id).emit("project_list_updated");
        io.to("user_" + projData[0].user_id).emit("stats_updated");
        io.to("client_" + projData[0].client_id).emit("project_list_updated");
        io.to("client_" + projData[0].client_id).emit("stats_updated");
      }
    });
    io.to("admins").emit("refresh_admin_dashboard");

    res.json({ message: "Invoice created", invoiceId: result.insertId });
  });
});

// UPDATE invoice status
app.put("/api/invoices/:id", (req, res) => {
  const invoiceId = req.params.id;
  const { status, user_id } = req.body;

  // Invoice tracking plan check
  if (user_id) {
    db.query("SELECT plan FROM users WHERE id = ?", [user_id], (err, userRows) => {
      if (!err && userRows.length > 0) {
        const limits = getPlanLimits(userRows[0].plan);
        if (!limits.invoiceTracking) {
          return res.status(403).json({
            message: "Invoice status tracking is available on Pro and Agency plans. Upgrade to manage invoice payments.",
            upgrade: true,
            requiredPlan: 'Pro'
          });
        }
      }
      proceedUpdateInvoice();
    });
    return;
  }
  proceedUpdateInvoice();

  function proceedUpdateInvoice() {
    db.query("SELECT project_id FROM invoices WHERE id = ?", [invoiceId], (err, results) => {
      if (err || results.length === 0) return res.status(500).json({ message: "Invoice not found" });
      const projectId = results[0].project_id;

      const sql = "UPDATE invoices SET status = ? WHERE id = ?";
      db.query(sql, [status, invoiceId], (err, result) => {
        if (err) return res.status(500).json({ message: "Error updating invoice" });

        // Emit live update for project invoices
        io.to("project_" + projectId).emit("project_details_updated");
        db.query("SELECT user_id, client_id FROM projects WHERE id = ?", [projectId], (err, projData) => {
          if (!err && projData.length > 0) {
            io.to("user_" + projData[0].user_id).emit("project_list_updated");
            io.to("user_" + projData[0].user_id).emit("stats_updated");
            io.to("client_" + projData[0].client_id).emit("project_list_updated");
            io.to("client_" + projData[0].client_id).emit("stats_updated");
          }
        });
        io.to("admins").emit("refresh_admin_dashboard");

        res.json({ message: "Invoice updated" });
      });
    });
  } // end proceedUpdateInvoice
});

// DELETE invoice
app.delete("/api/invoices/:id", (req, res) => {
  const invoiceId = req.params.id;
  db.query("SELECT project_id FROM invoices WHERE id = ?", [invoiceId], (err, results) => {
    if (err || results.length === 0) return res.status(500).json({ message: "Invoice not found" });
    const projectId = results[0].project_id;

    const sql = "DELETE FROM invoices WHERE id = ?";
    db.query(sql, [invoiceId], (err) => {
      if (err) return res.status(500).json({ message: "Error deleting invoice" });

      // Emit live update for project invoices
      io.to("project_" + projectId).emit("project_details_updated");
      db.query("SELECT user_id, client_id FROM projects WHERE id = ?", [projectId], (err, projData) => {
        if (!err && projData.length > 0) {
          io.to("user_" + projData[0].user_id).emit("project_list_updated");
          io.to("user_" + projData[0].user_id).emit("stats_updated");
          io.to("client_" + projData[0].client_id).emit("project_list_updated");
          io.to("client_" + projData[0].client_id).emit("stats_updated");
        }
      });
      io.to("admins").emit("refresh_admin_dashboard");

      res.json({ message: "Invoice deleted" });
    });
  });
});

app.delete("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const sql = "DELETE FROM users WHERE id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Error deleting user" });

    db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (NULL, 'Delete', ?)",
      [`Freelancer (ID: ${userId}) has been deleted`], () => { });

    res.json({ message: "User deleted successfully" });
  });
});

app.delete("/api/clients/:id", (req, res) => {
  const clientId = req.params.id;
  const sql = "DELETE FROM clients WHERE id = ?";
  db.query(sql, [clientId], (err, result) => {
    if (err) return res.status(500).json({ message: "Error deleting client" });

    db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (NULL, 'Delete', ?)",
      [`Client (ID: ${clientId}) has been deleted`], () => { });

    res.json({ message: "Client deleted successfully" });
  });
});

app.delete("/api/projects/:id", (req, res) => {
  const projectId = req.params.id;

  db.query("SELECT user_id, client_id FROM projects WHERE id = ?", [projectId], (selErr, projData) => {
    // Fetch file names to clean physical uploads folder
    db.query("SELECT filename FROM project_files WHERE project_id = ?", [projectId], (err, files) => {
      if (!err && files && files.length > 0) {
        files.forEach(f => {
          const filePath = path.join(uploadsDir, f.filename);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) { console.log("Error deleting file:", e); }
          }
        });
      }

      // Begin cascades in DB
      db.query("DELETE FROM project_messages WHERE project_id = ?", [projectId], (err) => {
        if (err) return res.status(500).json({ message: "Error deleting project messages" });

        db.query("DELETE FROM invoices WHERE project_id = ?", [projectId], (err) => {
          if (err) return res.status(500).json({ message: "Error deleting project invoices" });

          db.query("DELETE FROM project_tasks WHERE project_id = ?", [projectId], (err) => {
            if (err) return res.status(500).json({ message: "Error deleting project tasks" });

            db.query("DELETE FROM project_files WHERE project_id = ?", [projectId], (err) => {
              if (err) return res.status(500).json({ message: "Error deleting project files" });

              const sql = "DELETE FROM projects WHERE id = ?";
              db.query(sql, [projectId], (err, result) => {
                if (err) return res.status(500).json({ message: "Error deleting project" });

                if (!selErr && projData && projData.length > 0) {
                  const { user_id, client_id } = projData[0];
                  io.to("user_" + user_id).emit("project_list_updated");
                  io.to("user_" + user_id).emit("stats_updated");
                  io.to("client_" + client_id).emit("project_list_updated");
                  io.to("client_" + client_id).emit("stats_updated");
                  io.to("project_" + projectId).emit("project_details_updated");
                }
                io.to("admins").emit("refresh_admin_dashboard");

                res.json({ message: "Project deleted successfully" });
              });
            });
          });
        });
      });
    });
  });
});

app.post("/api/client-login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM clients WHERE email = ?";

  db.query(sql, [email], async (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.length === 0) {
      return res.status(400).json({ message: "Client not found" });
    }

    const client = result[0];

    // Ban check
    if (client.banned_until && new Date(client.banned_until) > new Date()) {
      return res.status(403).json({
        message: `Your account is temporarily banned until ${new Date(client.banned_until).toLocaleString()}.`,
        banned: true,
        clientId: client.id,
        bannedUntil: client.banned_until,
        unbanRequested: client.unban_requested === 1
      });
    }

    const isMatch = await bcrypt.compare(password, client.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: client.id, email: client.email },
      "secretkey",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      client: {
        id: client.id,
        name: client.name,
        email: client.email
      }
    });
  });
});

const authenticateClient = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Access Denied" });

  const token = authHeader.split(" ")[1];
  try {
    const verified = jwt.verify(token, "secretkey");
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

app.get("/api/client/projects", authenticateClient, (req, res) => {
  const client_id = req.user.id;

  const sql = `
    SELECT p.*, u.name as freelancerName, u.image as freelancerImage, u.plan as freelancerPlan 
    FROM projects p
    JOIN users u ON p.user_id = u.id
    WHERE p.client_id = ?
  `;

  db.query(sql, [client_id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching data" });
    }

    res.json(result);
  });
});

// GET messages for a project
app.get("/api/projects/:id/messages", (req, res) => {
  const projectId = req.params.id;
  const sql = "SELECT * FROM project_messages WHERE project_id = ? ORDER BY created_at ASC";

  db.query(sql, [projectId], (err, result) => {
    if (err) return res.status(500).json({ message: "Error fetching messages" });
    res.json(result);
  });
});

// POST message to a project
app.post("/api/projects/:id/messages", (req, res) => {
  const projectId = req.params.id;
  const { sender_type, sender_id, message } = req.body;
  // sender_type could be 'freelancer' or 'client'

  // Real-time chat plan check (based on freelancer's plan)
  db.query(
    "SELECT u.plan FROM projects p JOIN users u ON p.user_id = u.id WHERE p.id = ?",
    [projectId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Server error checking chat limits" });
      if (rows.length === 0) return res.status(404).json({ message: "Project or freelancer not found" });

      const plan = rows[0].plan || 'Starter';
      const limits = getPlanLimits(plan);

      if (!limits.realtime) {
        return res.status(403).json({
          message: sender_type === 'freelancer'
            ? "Real-time chat is available on Pro and Agency plans. Upgrade to enable live messaging."
            : "Real-time chat is disabled because your freelancer is on the Starter plan.",
          upgrade: sender_type === 'freelancer',
          requiredPlan: 'Pro'
        });
      }

      proceedSendMessage();
    }
  );

  function proceedSendMessage() {

    const sql = "INSERT INTO project_messages (project_id, sender_type, sender_id, message) VALUES (?, ?, ?, ?)";

    db.query(sql, [projectId, sender_type, sender_id, message], (err, result) => {
      if (err) return res.status(500).json({ message: "Error sending message" });

      const messageId = result.insertId;
      const messageData = {
        id: messageId,
        project_id: projectId,
        sender_type,
        sender_id,
        message,
        created_at: new Date()
      };

      // Emit real-time message to project room
      io.to("project_" + projectId).emit("new_message", messageData);

      // If sender is client, notify freelancer of new notification
      if (sender_type === 'client') {
        db.query("SELECT user_id FROM projects WHERE id = ?", [projectId], (err, projRes) => {
          if (!err && projRes.length > 0) {
            const freelancerId = projRes[0].user_id;
            io.to("user_" + freelancerId).emit("notifications_updated");
          }
        });
        db.query("SELECT user_id FROM project_assignments WHERE project_id = ?", [projectId], (err, assignRes) => {
          if (!err && assignRes) {
            assignRes.forEach(row => {
              io.to("user_" + row.user_id).emit("notifications_updated");
            });
          }
        });
      }

      res.json({ message: "Message sent", messageId });
    });
  } // end proceedSendMessage
});

// GET PLAN LIMITS + USAGE for a user
app.get("/api/users/:id/plan-limits", async (req, res) => {
  const userId = req.params.id;
  const ownerId = await getAgencyOwnerId(userId);

  db.query("SELECT plan FROM users WHERE id = ?", [ownerId], (err, userRows) => {
    if (err || userRows.length === 0) return res.status(404).json({ message: "User not found" });
    const plan = userRows[0].plan || 'Starter';
    const limits = getPlanLimits(plan);

    Promise.all([
      new Promise(resolve => db.query("SELECT COUNT(*) as cnt FROM projects WHERE user_id = ?", [ownerId], (e, r) => resolve(r ? r[0].cnt : 0))),
      new Promise(resolve => db.query("SELECT COUNT(*) as cnt FROM clients WHERE user_id = ?", [ownerId], (e, r) => resolve(r ? r[0].cnt : 0)))
    ]).then(([projectCount, clientCount]) => {
      res.json({
        plan,
        limits,
        usage: { projects: projectCount, clients: clientCount }
      });
    }).catch(() => res.status(500).json({ message: "Error computing limits" }));
  });
});

// GET authentic dashboard stats
app.get("/api/users/:id/stats", async (req, res) => {
  const userId = req.params.id;
  const ownerId = await getAgencyOwnerId(userId);

  // Analytics plan check
  db.query("SELECT plan, role FROM users WHERE id = ?", [userId], (err, userRows) => {
    if (err || userRows.length === 0) return res.status(500).json({ message: "User not found" });
    const role = userRows[0].role;
    const plan = userRows[0].plan || 'Starter';
    const limits = getPlanLimits(plan);

    if (!limits.analytics) {
      return res.status(403).json({
        message: "Analytics are available on Pro and Agency plans. Upgrade to access full stats.",
        upgrade: true,
        requiredPlan: 'Pro'
      });
    }

    if (role === 'member') {
      // Member dashboard: activeProjects counts assigned active projects, revenue/invoices 0
      const sql = `
        SELECT
          (SELECT COUNT(DISTINCT p.id) FROM projects p JOIN project_assignments pa ON p.id = pa.project_id WHERE pa.user_id = ? AND p.status != 'Completed') AS activeProjects,
          0 AS pendingInvoices,
          0 AS totalRevenue
      `;
      db.query(sql, [userId], (err2, result) => {
        if (err2) return res.json({ activeProjects: 0, pendingInvoices: 0, totalRevenue: 0 });
        res.json(result[0]);
      });
    } else {
      const sql = `
        SELECT
          (SELECT COUNT(*) FROM projects WHERE user_id = ? AND status != 'Completed') AS activeProjects,
          (SELECT COUNT(*) FROM invoices i JOIN projects p ON i.project_id = p.id WHERE p.user_id = ? AND i.status = 'Pending') AS pendingInvoices,
          (SELECT IFNULL(SUM(amount), 0) FROM invoices i JOIN projects p ON i.project_id = p.id WHERE p.user_id = ? AND i.status = 'Paid') AS totalRevenue
      `;
      db.query(sql, [ownerId, ownerId, ownerId], (err2, result) => {
        if (err2) return res.json({ activeProjects: 0, pendingInvoices: 0, totalRevenue: 0 });
        res.json(result[0]);
      });
    }
  });
});

app.get("/api/users/:id/notifications", async (req, res) => {
  const userId = req.params.id;
  const ownerId = await getAgencyOwnerId(userId);

  db.query("SELECT role FROM users WHERE id = ?", [userId], (err, userRows) => {
    if (err || userRows.length === 0) return res.status(500).json({ error: "User not found" });
    const role = userRows[0].role;
    
    if (role === 'member') {
      const sql = `
        SELECT COUNT(*) as total, MAX(pm.project_id) as latest_project_id
        FROM project_messages pm
        JOIN projects p ON pm.project_id = p.id
        JOIN project_assignments pa ON p.id = pa.project_id
        WHERE pa.user_id = ? AND pm.sender_type = 'client'
      `;
      db.query(sql, [userId], (err2, results) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({
          total: results[0].total,
          latest_project_id: results[0].latest_project_id
        });
      });
    } else {
      const sql = `
        SELECT COUNT(*) as total, MAX(pm.project_id) as latest_project_id
        FROM project_messages pm
        JOIN projects p ON pm.project_id = p.id
        WHERE p.user_id = ? AND pm.sender_type = 'client'
      `;
      db.query(sql, [ownerId], (err2, results) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({
          total: results[0].total,
          latest_project_id: results[0].latest_project_id
        });
      });
    }
  });
});

// =======================
// PROJECT FILES (Multer Upload)
// =======================

app.get("/api/projects/:id/files", (req, res) => {
  const projectId = req.params.id;
  db.query("SELECT * FROM project_files WHERE project_id = ? ORDER BY created_at DESC", [projectId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching files" });
    res.json(results);
  });
});

app.post("/api/projects/:id/files", upload.single("file"), (req, res) => {
  const projectId = req.params.id;
  const file = req.file;
  if (!file) return res.status(400).json({ message: "No file uploaded" });

  // Plan limit check on file uploads
  const uploadUserId = req.body.user_id;
  if (uploadUserId) {
    getAgencyOwnerId(uploadUserId).then(ownerId => {
      db.query("SELECT plan FROM users WHERE id = ?", [ownerId], (err, userRows) => {
        if (!err && userRows.length > 0) {
          const limits = getPlanLimits(userRows[0].plan);
          db.query("SELECT COUNT(*) as cnt FROM project_files WHERE project_id = ?", [projectId], (err, countRows) => {
            if (!err && countRows[0].cnt >= limits.maxFiles) {
              const filePath = path.join(uploadsDir, file.filename);
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
              return res.status(403).json({
                message: `Your ${userRows[0].plan || 'Starter'} plan allows a maximum of ${limits.maxFiles} file(s) per project. Upgrade to upload more.`,
                upgrade: true,
                requiredPlan: userRows[0].plan === 'Starter' ? 'Pro' : 'Agency'
              });
            }
            proceedFileUpload();
          });
          return;
        }
        proceedFileUpload();
      });
    });
  } else {
    proceedFileUpload();
  }

  function proceedFileUpload() {

    const sql = "INSERT INTO project_files (project_id, filename, original_name, mime_type, size) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [projectId, file.filename, file.originalname, file.mimetype, file.size], (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });

      // Auto-send message about file upload ONLY if user plan allows realtime chat
      const fileUserId = req.body.user_id;
      if (fileUserId) {
        getAgencyOwnerId(fileUserId).then(ownerId => {
          db.query("SELECT plan FROM users WHERE id = ?", [ownerId], (err, planRows) => {
            if (!err && planRows.length > 0) {
              const limits = getPlanLimits(planRows[0].plan);
              if (limits.realtime) {
                const fileMsg = `New File Uploaded: ${file.originalname}`;
                db.query("INSERT INTO project_messages (project_id, sender_type, sender_id, message) VALUES (?, 'freelancer', ?, ?)",
                  [projectId, fileUserId, fileMsg], (msgErr, msgResult) => {
                    if (!msgErr) {
                      io.to("project_" + projectId).emit("new_message", {
                        id: msgResult.insertId, project_id: projectId,
                        sender_type: 'freelancer', sender_id: fileUserId,
                        message: fileMsg, created_at: new Date()
                      });
                    }
                  }
                );
              }
            }
            // Emit live update for project files list regardless of plan
            io.to("project_" + projectId).emit("project_details_updated");
            res.json({ message: "File uploaded successfully", fileId: result.insertId, filename: file.filename });
          });
        });
        return;
      }

      // Emit live update for project files
      io.to("project_" + projectId).emit("project_details_updated");

      res.json({ message: "File uploaded successfully", fileId: result.insertId, filename: file.filename });
    });
  } // end proceedFileUpload
});

app.delete("/api/files/:id", (req, res) => {
  const fileId = req.params.id;
  db.query("SELECT * FROM project_files WHERE id = ?", [fileId], (err, results) => {
    if (err || results.length === 0) return res.status(500).json({ message: "File not found" });
    const fileData = results[0];

    // Delete physical file
    const filePath = path.join(uploadsDir, fileData.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.query("DELETE FROM project_files WHERE id = ?", [fileId], (err) => {
      if (err) return res.status(500).json({ message: "Error deleting record" });

      // Emit live update for project files
      io.to("project_" + fileData.project_id).emit("project_details_updated");

      res.json({ message: "File deleted successfully" });
    });
  });
});

// =======================
// TASKS & AUTO PROGRESS
// =======================

// =======================
// TYPING INDICATOR (In-Memory)
// =======================
const typingStatus = {};

app.post("/api/projects/:id/typing", (req, res) => {
  const projectId = req.params.id;
  const { user_type } = req.body;

  if (!typingStatus[projectId]) {
    typingStatus[projectId] = {};
  }

  typingStatus[projectId][user_type] = Date.now();
  res.json({ success: true });
});

app.get("/api/projects/:id/typing", (req, res) => {
  const projectId = req.params.id;
  const status = typingStatus[projectId] || {};
  const now = Date.now();

  const isFreelancerTyping = status.freelancer && (now - status.freelancer < 4000);
  const isClientTyping = status.client && (now - status.client < 4000);

  res.json({
    freelancer: isFreelancerTyping,
    client: isClientTyping
  });
});

// =======================

// Helper: Calculate progress automatically based on weight
const updateProjectProgress = (projectId) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT SUM(weight) as total_weight FROM project_tasks WHERE project_id = ? AND is_completed = 1";
    db.query(sql, [projectId], (err, results) => {
      if (err) return reject(err);
      const progress = results[0].total_weight || 0;
      // Cap at 100 just in case
      const finalProgress = progress > 100 ? 100 : progress;

      let status = 'Pending';
      if (finalProgress > 0 && finalProgress < 100) status = 'In Progress';
      else if (finalProgress >= 100) status = 'Completed';

      db.query("UPDATE projects SET progress = ?, status = ? WHERE id = ?", [finalProgress, status, projectId], (err) => {
        if (err) return reject(err);
        resolve({ progress: finalProgress, status });
      });
    });
  });
};

app.get("/api/clients/:freelancerId", (req, res) => {
  const { freelancerId } = req.params;
  db.query("SELECT id, name, email, user_id, created_at FROM clients WHERE user_id = ?", [freelancerId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.get("/api/clients/direct/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT id, name, email, user_id, status, banned_until, image, created_at FROM clients WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) return res.status(404).json({ message: "Client not found" });

    const client = result[0];
    if (client.banned_until && new Date(client.banned_until) > new Date()) {
      client.is_banned = true;
    } else {
      client.is_banned = false;
    }
    res.json(client);
  });
});

app.get("/api/projects/:id/tasks", (req, res) => {
  const projectId = req.params.id;
  db.query("SELECT * FROM project_tasks WHERE project_id = ? ORDER BY created_at ASC", [projectId], (err, result) => {
    if (err) return res.status(500).json({ message: "Error fetching tasks" });
    res.json(result);
  });
});

app.post("/api/projects/:id/tasks", (req, res) => {
  const projectId = req.params.id;
  const { title } = req.body;
  db.query("INSERT INTO project_tasks (project_id, title) VALUES (?, ?)", [projectId, title], async (err, result) => {
    if (err) return res.status(500).json({ message: "Error creating task" });
    try {
      const resultData = await updateProjectProgress(projectId);

      io.to("project_" + projectId).emit("project_details_updated");
      db.query("SELECT user_id, client_id FROM projects WHERE id = ?", [projectId], (err, projData) => {
        if (!err && projData.length > 0) {
          io.to("user_" + projData[0].user_id).emit("project_list_updated");
          io.to("user_" + projData[0].user_id).emit("stats_updated");
          io.to("client_" + projData[0].client_id).emit("project_list_updated");
          io.to("client_" + projData[0].client_id).emit("stats_updated");
          io.to("admins").emit("refresh_admin_dashboard");
        }
      });

      res.json({ message: "Task created", taskId: result.insertId, progress: resultData.progress, status: resultData.status });
    } catch (e) {
      res.status(500).json({ message: "Task created but progress update failed" });
    }
  });
});

app.put("/api/tasks/:id", (req, res) => {
  const taskId = req.params.id;
  const { is_completed } = req.body;
  db.query("SELECT project_id FROM project_tasks WHERE id = ?", [taskId], (err, results) => {
    if (err || results.length === 0) return res.status(500).json({ message: "Task not found" });
    const projectId = results[0].project_id;
    db.query("UPDATE project_tasks SET is_completed = ? WHERE id = ?", [is_completed, taskId], async (err) => {
      if (err) return res.status(500).json({ message: "Error updating task" });
      try {
        const resultData = await updateProjectProgress(projectId);

        io.to("project_" + projectId).emit("project_details_updated");
        db.query("SELECT user_id, client_id FROM projects WHERE id = ?", [projectId], (err, projData) => {
          if (!err && projData.length > 0) {
            io.to("user_" + projData[0].user_id).emit("project_list_updated");
            io.to("user_" + projData[0].user_id).emit("stats_updated");
            io.to("client_" + projData[0].client_id).emit("project_list_updated");
            io.to("client_" + projData[0].client_id).emit("stats_updated");
            io.to("admins").emit("refresh_admin_dashboard");
          }
        });

        res.json({ message: "Task updated", progress: resultData.progress, status: resultData.status });
      } catch (e) {
        res.status(500).json({ message: "Task updated but progress update failed" });
      }
    });
  });
});

app.delete("/api/tasks/:id", (req, res) => {
  const taskId = req.params.id;
  db.query("SELECT project_id FROM project_tasks WHERE id = ?", [taskId], (err, results) => {
    if (err || results.length === 0) return res.status(500).json({ message: "Task not found" });
    const projectId = results[0].project_id;
    db.query("DELETE FROM project_tasks WHERE id = ?", [taskId], async (err) => {
      if (err) return res.status(500).json({ message: "Error deleting task" });
      try {
        const resultData = await updateProjectProgress(projectId);

        io.to("project_" + projectId).emit("project_details_updated");
        db.query("SELECT user_id, client_id FROM projects WHERE id = ?", [projectId], (err, projData) => {
          if (!err && projData.length > 0) {
            io.to("user_" + projData[0].user_id).emit("project_list_updated");
            io.to("user_" + projData[0].user_id).emit("stats_updated");
            io.to("client_" + projData[0].client_id).emit("project_list_updated");
            io.to("client_" + projData[0].client_id).emit("stats_updated");
            io.to("admins").emit("refresh_admin_dashboard");
          }
        });

        res.json({ message: "Task deleted", progress: resultData.progress, status: resultData.status });
      } catch (e) {
        res.status(500).json({ message: "Task deleted but progress update failed" });
      }
    });
  });
});

// GET USER BY ID
app.get("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  db.query("SELECT id, name, email, plan, role, status, banned_until, image FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching user" });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });

    const user = results[0];
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      user.is_banned = true;
    } else {
      user.is_banned = false;
    }
    res.json(user);
  });
});

// ADMIN LOGIN API
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@gridlancer.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (email === adminEmail && password === adminPassword) {
    const token = jwt.sign(
      { role: "admin", email: adminEmail },
      "secretkey",
      { expiresIn: "7d" }
    );
    return res.json({
      message: "Admin login successful",
      token,
      admin: { email: adminEmail, role: "admin" }
    });
  } else {
    return res.status(400).json({ message: "Invalid admin credentials" });
  }
});

// GET ADMIN SETTINGS
app.get("/api/admin/settings", (req, res) => {
  db.query("SELECT * FROM system_settings", (err, result) => {
    if (err) return res.status(500).json({ message: "Error fetching settings" });
    const settings = {};
    result.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  });
});

// POST ADMIN SETTINGS
app.post("/api/admin/settings", (req, res) => {
  const { admin_bank_account } = req.body;
  db.query("INSERT INTO system_settings (`key`, `value`) VALUES ('admin_bank_account', ?) ON DUPLICATE KEY UPDATE `value` = ?",
    [admin_bank_account, admin_bank_account], (err) => {
      if (err) return res.status(500).json({ message: "Error updating settings" });
      res.json({ message: "Settings updated successfully" });
    });
});

// GET ADMIN DASHBOARD
app.get("/api/admin/dashboard", (req, res) => {
  const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  };

  Promise.all([
    query("SELECT p.*, u.name as freelancer_name, c.name as client_name FROM projects p LEFT JOIN users u ON p.user_id = u.id LEFT JOIN clients c ON p.client_id = c.id ORDER BY p.id DESC"),
    query("SELECT id, name, email, plan, status, banned_until, unban_requested FROM users ORDER BY id DESC"),
    query("SELECT c.*, u.name as freelancer_name FROM clients c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.id DESC"),
    query("SELECT * FROM activity_log ORDER BY id DESC LIMIT 100"),
    query("SELECT ur.*, u.name as freelancer_name, u.email as freelancer_email FROM upgrade_requests ur JOIN users u ON ur.user_id = u.id ORDER BY ur.id DESC"),
    query("SELECT comp.*, c.name as client_name, c.email as client_email, u.name as freelancer_name, u.email as freelancer_email, p.title as project_title FROM complaints comp JOIN clients c ON comp.client_id = c.id JOIN users u ON comp.freelancer_id = u.id JOIN projects p ON comp.project_id = p.id ORDER BY comp.id DESC")
  ]).then(([projects, freelancers, clients, activities, upgradeRequests, complaints]) => {
    res.json({
      projects,
      freelancers,
      clients,
      activities,
      upgradeRequests,
      complaints
    });
  }).catch(err => {
    console.log("Error in admin dashboard:", err);
    res.status(500).json({ message: "Error loading admin dashboard stats" });
  });
});

// GET PROJECT DETAILS FOR ADMIN
app.get("/api/admin/projects/:id/details", (req, res) => {
  const projectId = req.params.id;
  const projectQuery = `
    SELECT p.*, u.name as freelancer_name, u.email as freelancer_email, c.name as client_name, c.email as client_email 
    FROM projects p 
    LEFT JOIN users u ON p.user_id = u.id 
    LEFT JOIN clients c ON p.client_id = c.id 
    WHERE p.id = ?
  `;
  db.query(projectQuery, [projectId], (err, projectResults) => {
    if (err || projectResults.length === 0) return res.status(404).json({ message: "Project not found" });
    const project = projectResults[0];

    db.query("SELECT * FROM invoices WHERE project_id = ? ORDER BY id DESC", [projectId], (err, invoices) => {
      if (err) invoices = [];
      db.query("SELECT * FROM project_tasks WHERE project_id = ? ORDER BY id ASC", [projectId], (err, tasks) => {
        if (err) tasks = [];
        db.query("SELECT * FROM project_messages WHERE project_id = ? ORDER BY created_at ASC", [projectId], (err, messages) => {
          if (err) messages = [];
          db.query("SELECT * FROM project_files WHERE project_id = ? ORDER BY created_at DESC", [projectId], (err, files) => {
            if (err) files = [];
            res.json({
              project,
              invoices,
              tasks,
              messages,
              files
            });
          });
        });
      });
    });
  });
});

// BAN USER
app.post("/api/admin/users/:id/ban", (req, res) => {
  const userId = req.params.id;
  const { duration } = req.body;
  let bannedUntil = null;
  const now = new Date();
  if (duration === '1d') {
    bannedUntil = new Date(now.setDate(now.getDate() + 1));
  } else if (duration === '1w') {
    bannedUntil = new Date(now.setDate(now.getDate() + 7));
  } else if (duration === '1m') {
    bannedUntil = new Date(now.setMonth(now.getMonth() + 1));
  } else if (duration === 'perm') {
    bannedUntil = new Date('2099-12-31 23:59:59');
  } else {
    return res.status(400).json({ message: "Invalid duration" });
  }

  db.query("UPDATE users SET status = 'banned', banned_until = ? WHERE id = ?", [bannedUntil, userId], (err) => {
    if (err) return res.status(500).json({ message: "Error banning user" });

    db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (?, 'Ban', ?)",
      [userId, `Freelancer (ID: ${userId}) has been banned until ${bannedUntil.toLocaleString()}`], () => { });

    io.to("user_" + userId).emit("user_banned", { banned_until: bannedUntil });

    res.json({ message: "User banned successfully", banned_until: bannedUntil });
  });
});

// UNBAN USER
app.post("/api/admin/users/:id/unban", (req, res) => {
  const userId = req.params.id;
  db.query("UPDATE users SET status = 'active', banned_until = NULL, unban_requested = 0 WHERE id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ message: "Error unbanning user" });

    db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (?, 'Unban', ?)",
      [userId, `Freelancer (ID: ${userId}) has been unbanned`], () => { });

    io.to("user_" + userId).emit("user_unbanned");

    res.json({ message: "User unbanned successfully" });
  });
});

// BAN CLIENT
app.post("/api/admin/clients/:id/ban", (req, res) => {
  const clientId = req.params.id;
  const { duration } = req.body;
  let bannedUntil = null;
  const now = new Date();
  if (duration === '1d') {
    bannedUntil = new Date(now.setDate(now.getDate() + 1));
  } else if (duration === '1w') {
    bannedUntil = new Date(now.setDate(now.getDate() + 7));
  } else if (duration === '1m') {
    bannedUntil = new Date(now.setMonth(now.getMonth() + 1));
  } else if (duration === 'perm') {
    bannedUntil = new Date('2099-12-31 23:59:59');
  } else {
    return res.status(400).json({ message: "Invalid duration" });
  }

  db.query("UPDATE clients SET status = 'banned', banned_until = ? WHERE id = ?", [bannedUntil, clientId], (err) => {
    if (err) return res.status(500).json({ message: "Error banning client" });

    db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (NULL, 'Ban', ?)",
      [`Client (ID: ${clientId}) has been banned until ${bannedUntil.toLocaleString()}`], () => { });

    io.to("client_" + clientId).emit("client_banned", { banned_until: bannedUntil });

    res.json({ message: "Client banned successfully", banned_until: bannedUntil });
  });
});

// UNBAN CLIENT
app.post("/api/admin/clients/:id/unban", (req, res) => {
  const clientId = req.params.id;
  db.query("UPDATE clients SET status = 'active', banned_until = NULL, unban_requested = 0 WHERE id = ?", [clientId], (err) => {
    if (err) return res.status(500).json({ message: "Error unbanning client" });

    db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (NULL, 'Unban', ?)",
      [`Client (ID: ${clientId}) has been unbanned`], () => { });

    io.to("client_" + clientId).emit("client_unbanned");

    res.json({ message: "Client unbanned successfully" });
  });
});

// REQUEST UNBAN USER
app.post("/api/users/:id/request-unban", (req, res) => {
  const userId = req.params.id;
  db.query("UPDATE users SET unban_requested = 1 WHERE id = ?", [userId], (err) => {
    if (err) return res.status(500).json({ message: "Error requesting unban" });

    db.query("SELECT name FROM users WHERE id = ?", [userId], (err, results) => {
      const name = results.length > 0 ? results[0].name : `Freelancer (ID: ${userId})`;
      db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (?, 'Unban Request', ?)",
        [userId, `${name} has requested to be unbanned`], () => {
          io.to("admins").emit("refresh_admin_dashboard");
        });
    });

    res.json({ message: "Unban request submitted successfully" });
  });
});

// REQUEST UNBAN CLIENT
app.post("/api/clients/:id/request-unban", (req, res) => {
  const clientId = req.params.id;
  db.query("UPDATE clients SET unban_requested = 1 WHERE id = ?", [clientId], (err) => {
    if (err) return res.status(500).json({ message: "Error requesting unban" });

    db.query("SELECT name FROM clients WHERE id = ?", [clientId], (err, results) => {
      const name = results.length > 0 ? results[0].name : `Client (ID: ${clientId})`;
      db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (NULL, 'Unban Request', ?)",
        [`${name} has requested to be unbanned`], () => {
          io.to("admins").emit("refresh_admin_dashboard");
        });
    });

    res.json({ message: "Unban request submitted successfully" });
  });
});

// UPGRADE REQUEST API
app.post("/api/upgrade-request", (req, res) => {
  const { user_id, requested_plan } = req.body;

  if (requested_plan === 'Starter') {
    db.query("UPDATE users SET plan = 'Starter' WHERE id = ?", [user_id], (err) => {
      if (err) return res.status(500).json({ message: "Error updating user plan to Starter" });

      // Cancel any pending upgrade requests for this user
      db.query("UPDATE upgrade_requests SET status = 'Cancelled' WHERE user_id = ? AND status = 'Pending'", [user_id], () => { });

      db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (?, 'Plan Changed', 'Freelancer changed plan to Starter (Free)')",
        [user_id], () => {
          io.to("admins").emit("refresh_admin_dashboard");
        });

      io.to("user_" + user_id).emit("plan_updated", { plan: "Starter" });

      return res.json({
        message: "Your plan has been updated to Starter (Free) instantly.",
        plan: "Starter",
        instant: true
      });
    });
    return;
  }

  db.query("SELECT * FROM upgrade_requests WHERE user_id = ? AND status = 'Pending'", [user_id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length > 0) {
      return res.json({ message: "Upgrade request is already pending approval.", request: results[0] });
    }

    db.query("INSERT INTO upgrade_requests (user_id, requested_plan, status, payment_status) VALUES (?, ?, 'Pending', 'Unpaid')",
      [user_id, requested_plan], (err, insertResult) => {
        if (err) return res.status(500).json({ message: "Error creating upgrade request" });

        db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (?, 'Upgrade Requested', ?)",
          [user_id, `Freelancer requested upgrade to ${requested_plan}`], () => {
            // Notify admins room to refresh dashboard
            io.to("admins").emit("refresh_admin_dashboard");
          });

        res.json({
          message: "Upgrade request created successfully. Please make payment to the admin's bank account.",
          requestId: insertResult.insertId
        });
      });
  });
});

// MARK PAID
app.post("/api/upgrade-request/:id/paid", (req, res) => {
  const requestId = req.params.id;
  db.query("UPDATE upgrade_requests SET payment_status = 'Paid' WHERE id = ?", [requestId], (err) => {
    if (err) return res.status(500).json({ message: "Error updating payment status" });

    db.query("SELECT user_id, requested_plan FROM upgrade_requests WHERE id = ?", [requestId], (err, results) => {
      if (!err && results.length > 0) {
        const { user_id, requested_plan } = results[0];
        db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (?, 'Upgrade Paid', ?)",
          [user_id, `Freelancer marked payment as paid for upgrade to ${requested_plan}`], () => {
            // Notify admins in real-time
            io.to("admins").emit("refresh_admin_dashboard");
          });
      }
    });
    res.json({ message: "Upgrade marked as Paid. Waiting for admin approval." });
  });
});

// GET USER UPGRADE REQUESTS
app.get("/api/upgrade-requests/user/:id", (req, res) => {
  const userId = req.params.id;
  db.query("SELECT * FROM upgrade_requests WHERE user_id = ? ORDER BY id DESC LIMIT 1", [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.json({ request: null });
    res.json({ request: results[0] });
  });
});

// GET ALL UPGRADE REQUESTS (ADMIN)
app.get("/api/admin/upgrade-requests", (req, res) => {
  db.query("SELECT ur.*, u.name as freelancer_name, u.email as freelancer_email FROM upgrade_requests ur JOIN users u ON ur.user_id = u.id ORDER BY ur.id DESC", (err, result) => {
    if (err) return res.status(500).json({ message: "Error fetching upgrade requests" });
    res.json(result);
  });
});

// APPROVE UPGRADE
app.post("/api/admin/upgrade-requests/:id/approve", (req, res) => {
  const requestId = req.params.id;
  db.query("SELECT * FROM upgrade_requests WHERE id = ?", [requestId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: "Request not found" });
    const reqData = results[0];

    db.query("UPDATE users SET plan = ? WHERE id = ?", [reqData.requested_plan, reqData.user_id], (err) => {
      if (err) return res.status(500).json({ message: "Error updating user plan" });

      db.query("UPDATE upgrade_requests SET status = 'Approved', payment_status = 'Paid' WHERE id = ?", [requestId], (err) => {
        if (err) console.log(err);

        db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (?, 'Upgrade Approved', ?)",
          [reqData.user_id, `Admin approved upgrade request to ${reqData.requested_plan}`], () => {
            // Notify admins room to refresh dashboard
            io.to("admins").emit("refresh_admin_dashboard");
          });

        // Notify freelancer that plan is updated!
        io.to("user_" + reqData.user_id).emit("plan_updated", { plan: reqData.requested_plan });

        // Notify freelancer's clients and project rooms that plan has updated!
        db.query("SELECT DISTINCT client_id, id FROM projects WHERE user_id = ?", [reqData.user_id], (err, projects) => {
          if (!err && projects) {
            projects.forEach(p => {
              io.to("client_" + p.client_id).emit("project_list_updated");
              io.to("project_" + p.id).emit("project_details_updated");
            });
          }
        });

        res.json({ message: `Successfully approved and upgraded user plan to ${reqData.requested_plan}` });
      });
    });
  });
});

// REJECT UPGRADE
app.post("/api/admin/upgrade-requests/:id/reject", (req, res) => {
  const requestId = req.params.id;
  db.query("SELECT * FROM upgrade_requests WHERE id = ?", [requestId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: "Request not found" });
    const reqData = results[0];

    db.query("UPDATE upgrade_requests SET status = 'Rejected' WHERE id = ?", [requestId], (err) => {
      if (err) return res.status(500).json({ message: "Error rejecting request" });

      db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (?, 'Upgrade Rejected', ?)",
        [reqData.user_id, `Admin rejected upgrade request to ${reqData.requested_plan}`], () => {
          // Notify admins room to refresh dashboard
          io.to("admins").emit("refresh_admin_dashboard");
        });

      // Notify freelancer that request status is changed
      io.to("user_" + reqData.user_id).emit("plan_updated", { plan: null });

      res.json({ message: "Upgrade request rejected" });
    });
  });
});

// SUBMIT COMPLAINT
app.post("/api/complaints", (req, res) => {
  const { client_id, freelancer_id, project_id, subject, description } = req.body;
  if (!client_id || !freelancer_id || !project_id || !subject || !description) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = "INSERT INTO complaints (client_id, freelancer_id, project_id, subject, description) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [client_id, freelancer_id, project_id, subject, description], (err, result) => {
    if (err) {
      console.log("Error inserting complaint:", err);
      return res.status(500).json({ message: "Error submitting complaint" });
    }

    db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (NULL, 'Complaint', ?)",
      [`Client (ID: ${client_id}) filed a complaint against Freelancer (ID: ${freelancer_id})`], () => {
        io.to("admins").emit("refresh_admin_dashboard");
      });

    // Check if freelancer has received 3 or more complaints from this same client
    db.query("SELECT COUNT(*) as count FROM complaints WHERE client_id = ? AND freelancer_id = ?", [client_id, freelancer_id], (err, countResult) => {
      if (!err && countResult.length > 0 && countResult[0].count >= 3) {
        const banDays = 2;
        const now = new Date();
        const bannedUntil = new Date(now.setDate(now.getDate() + banDays));
        const banMsg = "you have 3 reports you are banned for 2 days";

        db.query("UPDATE users SET status = 'banned', banned_until = ?, ban_reason = ? WHERE id = ?", [bannedUntil, banMsg, freelancer_id], (err) => {
          if (err) {
            console.log("Error auto-banning user:", err);
            return;
          }
          db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (?, 'Ban', ?)",
            [freelancer_id, `Freelancer (ID: ${freelancer_id}) automatically banned for 2 days due to 3 complaints from client (ID: ${client_id})`], () => { });

          io.to("user_" + freelancer_id).emit("user_banned", { banned_until: bannedUntil, reason: banMsg });
          io.to("admins").emit("refresh_admin_dashboard");
        });
      }
    });

    res.json({ message: "Complaint submitted successfully", complaintId: result.insertId });
  });
});

// RESOLVE COMPLAINT WITH CUSTOM MESSAGE
app.post("/api/admin/complaints/:id/resolve", (req, res) => {
  const complaintId = req.params.id;
  const { admin_response } = req.body;

  db.query("UPDATE complaints SET status = 'Resolved', admin_response = ? WHERE id = ?", [admin_response || null, complaintId], (err) => {
    if (err) {
      console.log("Error resolving complaint:", err);
      return res.status(500).json({ message: "Error resolving complaint" });
    }

    // Get project_id and client_id to notify the client via socket
    db.query("SELECT project_id, client_id FROM complaints WHERE id = ?", [complaintId], (err, results) => {
      if (!err && results.length > 0) {
        const { project_id, client_id } = results[0];
        io.to("project_" + project_id).emit("project_details_updated");
        io.to("client_" + client_id).emit("project_list_updated");
      }
    });

    db.query("INSERT INTO activity_log (user_id, activity_type, message) VALUES (NULL, 'Complaint Resolved', ?)",
      [`Admin marked complaint ID ${complaintId} as resolved`], () => {
        io.to("admins").emit("refresh_admin_dashboard");
      });

    res.json({ message: "Complaint marked as resolved successfully" });
  });
});

// GET COMPLAINTS BY PROJECT
app.get("/api/projects/:projectId/complaints", (req, res) => {
  const projectId = req.params.projectId;
  db.query("SELECT * FROM complaints WHERE project_id = ? ORDER BY id DESC", [projectId], (err, results) => {
    if (err) {
      console.log("Error fetching complaints for project:", err);
      return res.status(500).json({ message: "Error fetching complaints" });
    }
    res.json(results);
  });
});



server.listen(5000, () => {
  console.log("Server running on port 5000");
});