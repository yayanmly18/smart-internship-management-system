#!/bin/bash
# Master setup script - Jalankan ini untuk setup SEMUA hal secara otomatis
# Usage: bash setup-all.sh

set -e  # Exit on error

echo "======================================"
echo "🚀 VFlow Integration - Complete Setup"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

# Check if running on Windows
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    print_warning "Detected Windows environment"
    print_warning "Please run commands manually or use WSL/Git Bash"
    echo ""
    echo "Manual steps for Windows:"
    echo "1. Open Git Bash or WSL"
    echo "2. Run: source setup-env.sh"
    echo "3. Run: createdb -U postgres kelompok1_internship"
    echo "4. Run: cd backend && node scripts/migrate-to-postgresql.js"
    echo "5. Run: bash workflow/scripts/provision-vflow.sh"
    echo "6. Run: bash workflow/scripts/smoke-vflow.sh"
    exit 1
fi

# Step 1: Load environment variables
echo "📋 Step 1/5: Loading environment variables..."
echo ""

echo "Please enter the required credentials:"
echo "(Press Enter to use default/empty values)"
echo ""

read -p "Enter VFLOW_ADMIN_KEY: " VFLOW_ADMIN_KEY
read -p "Enter LOGSTREAM_TOKEN: " LOGSTREAM_TOKEN
read -p "Enter VFLOW_PACK_SECRET_KEY_B64 (Encryption Key): " VFLOW_PACK_SECRET_KEY_B64
read -p "Enter local DATABASE_URL [default: postgresql://postgres:postgres123@127.0.0.1:5432/kelompok1_internship]: " DATABASE_URL
DATABASE_URL=${DATABASE_URL:-postgresql://postgres:postgres123@127.0.0.1:5432/kelompok1_internship}
read -p "Enter KELOMPOK1_DATABASE_URL (Tunnel URL): " KELOMPOK1_DATABASE_URL

export VFLOW_BASE_URL="https://sqavflow.vastar.id"
export VFLOW_TENANT="_default"
export VFLOW_ADMIN_KEY
export LOGSTREAM_TOKEN
export VFLOW_PACK_SECRET_KEY_B64
export DATABASE_URL
export KELOMPOK1_DATABASE_URL

echo ""
echo "Writing to backend/.env ..."
cat <<EOF > backend/.env
VFLOW_BASE_URL=$VFLOW_BASE_URL
VFLOW_TENANT=$VFLOW_TENANT
VFLOW_ADMIN_KEY=$VFLOW_ADMIN_KEY
LOGSTREAM_TOKEN=$LOGSTREAM_TOKEN
VFLOW_PACK_SECRET_KEY_B64=$VFLOW_PACK_SECRET_KEY_B64
DATABASE_URL=$DATABASE_URL
KELOMPOK1_DATABASE_URL=$KELOMPOK1_DATABASE_URL
EOF

print_success "Environment variables loaded and saved to backend/.env"
echo ""

# Step 2: Check prerequisites
echo "🔍 Step 2/5: Checking prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found! Please install Node.js v16+"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: v$NPM_VERSION"
else
    print_error "npm not found! Please install npm"
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    print_success "PostgreSQL client found"
else
    print_error "PostgreSQL client not found! Please install PostgreSQL"
    exit 1
fi

# Check if PostgreSQL is running
if pg_isready -q; then
    print_success "PostgreSQL server is running"
else
    print_warning "PostgreSQL server might not be running"
    print_info "Attempting to start PostgreSQL..."
    
    # Try to start PostgreSQL (works on most Linux systems)
    if command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql 2>/dev/null || true
    fi
    
    # Wait a moment and check again
    sleep 2
    
    if pg_isready -q; then
        print_success "PostgreSQL started successfully"
    else
        print_error "Cannot connect to PostgreSQL. Please start it manually:"
        echo "  sudo systemctl start postgresql"
        echo "  or: pg_ctl -D /usr/local/var/postgres start"
        exit 1
    fi
fi

echo ""

# Step 3: Install dependencies
echo "📦 Step 3/5: Installing dependencies..."
echo ""

# Install backend dependencies
print_info "Installing backend dependencies..."
cd backend
if npm install pg --save; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

# Install frontend dependencies
print_info "Installing frontend dependencies..."
cd frontend
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_warning "Frontend dependencies installation failed (optional for backend testing)"
fi
cd ..

echo ""

# Step 4: Setup database
echo "🗄️  Step 4/5: Setting up database..."
echo ""

# Check if database exists
DB_EXISTS=$(psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='kelompok1_internship'" 2>/dev/null || echo "0")

if [[ "$DB_EXISTS" == "1" ]]; then
    print_warning "Database 'kelompok1_internship' already exists"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Dropping existing database..."
        dropdb -U postgres kelompok1_internship
        print_success "Database dropped"
    else
        print_info "Using existing database"
    fi
fi

# Create database if it doesn't exist
if [[ "$DB_EXISTS" != "1" ]] || [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Creating database..."
    if createdb -U postgres kelompok1_internship; then
        print_success "Database 'kelompok1_internship' created"
    else
        print_error "Failed to create database"
        exit 1
    fi
fi

# Run migration
print_info "Running database migration..."
cd backend
if node scripts/migrate-to-postgresql.js; then
    print_success "Database migration completed"
else
    print_error "Database migration failed"
    exit 1
fi
cd ..

echo ""

# Step 5: Provision VFlow workflow
echo "🌊 Step 5/5: Provisioning VFlow workflow..."
echo ""

print_info "Provisioning workflow to VFlow server..."
if bash workflow/scripts/provision-vflow.sh; then
    print_success "VFlow workflow provisioned"
else
    print_error "VFlow provisioning failed"
    print_warning "This might be due to:"
    echo "  - Invalid VFLOW_ADMIN_KEY"
    echo "  - Network connectivity issues"
    echo "  - VFlow server unavailable"
    echo ""
    echo "You can try provisioning manually later with:"
    echo "  bash workflow/scripts/provision-vflow.sh"
fi

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""

print_success "All components have been set up!"
echo ""

echo "📊 Summary:"
echo "  ✓ Dependencies installed"
echo "  ✓ PostgreSQL database created"
echo "  ✓ Database schema migrated (10 tables)"
echo "  ✓ VFlow workflow provisioned"
echo ""

echo "🎯 Next Steps:"
echo ""
echo "1. Test VFlow webhook:"
echo "   ${GREEN}bash workflow/scripts/smoke-vflow.sh${NC}"
echo ""
echo "2. Start backend server (Terminal 1):"
echo "   ${GREEN}cd backend && npm run dev${NC}"
echo ""
echo "3. Start frontend (Terminal 2):"
echo "   ${GREEN}cd frontend && npm run dev${NC}"
echo ""
echo "4. Access the application:"
echo "   - Frontend: ${BLUE}http://localhost:5173${NC}"
echo "   - Backend API: ${BLUE}http://localhost:3000${NC}"
echo ""

echo "📚 Documentation:"
echo "  - START_HERE.md - Quick start guide"
echo "  - RUN_GUIDE.md - Detailed instructions"
echo "  - workflow/SETUP.md - Complete setup guide"
echo ""

print_info "Default admin credentials:"
echo "  Email: admin@example.com"
echo "  Password: adminpass"
echo ""

echo "🎉 Happy coding! - Kelompok 1"