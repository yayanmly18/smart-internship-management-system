# smart-internship-management-system
Workflow-based Internship Management System using VFlow, VRule, Starlark Activity, and Event-Driven Architecture for registration, approval, monitoring, evaluation, and certification processes.

AWS DEPLOYMENT GUIDE - Smart Internship Management System (Backend)
1. OVERVIEW
Backend menggunakan Node.js (Express), VFlow, VRule, Starlark, NATS, dan Audit System.

2. AWS REQUIREMENTS
Ubuntu 20.04/22.04, Node.js 18+, Git, PM2, ports 3000 & 4222 open.

3. INSTALL DEPENDENCIES
sudo apt update && sudo apt upgrade -y
Install Node.js:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

4. CLONE PROJECT
git clone https://github.com/USERNAME/smart-internship-management-system.git
cd backend

5. INSTALL DEPENDENCIES
npm install

6. ENV CONFIG
PORT=3000
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASS=your-db-password
NATS_URL=nats://localhost:4222

7. RUN APPLICATION
node app.js OR pm2 start app.js

8. TESTING
http://EC2_PUBLIC_IP:3000/health

9. ARCHITECTURE FLOW
Frontend → API → VFlow → VRule → Starlark → NATS → Audit Log

10. FINAL RESULT
System ready for AWS deployment and production use.
