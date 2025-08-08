#!/bin/bash

# PlugPost Deployment Script
# This script handles deployment to various environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
BUILD_ONLY=false
SKIP_TESTS=false
SKIP_BUILD=false

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV    Set deployment environment (development|staging|production)"
    echo "  -b, --build-only         Only build the application, don't deploy"
    echo "  -s, --skip-tests         Skip running tests"
    echo "  --skip-build             Skip build step (for quick deployments)"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e staging            Deploy to staging environment"
    echo "  $0 -b                    Build only, don't deploy"
    echo "  $0 -s -e production      Deploy to production, skip tests"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Valid environments: development, staging, production"
    exit 1
fi

print_status "Starting deployment for environment: $ENVIRONMENT"

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed"
        exit 1
    fi
    
    print_status "All dependencies are available"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        print_warning "Skipping tests"
        return
    fi
    
    print_status "Running tests..."
    npm run test
    
    print_status "Running type check..."
    npm run type-check
    
    print_status "Running linter..."
    npm run lint
}

# Build application
build_application() {
    if [ "$SKIP_BUILD" = true ]; then
        print_warning "Skipping build"
        return
    fi
    
    print_status "Building application..."
    
    # Set environment-specific variables
    case $ENVIRONMENT in
        development)
            export NODE_ENV=development
            ;;
        staging)
            export NODE_ENV=production
            export NEXT_PUBLIC_ENV=staging
            ;;
        production)
            export NODE_ENV=production
            export NEXT_PUBLIC_ENV=production
            ;;
    esac
    
    npm run build
}

# Database operations
handle_database() {
    print_status "Handling database operations..."
    
    # Generate Prisma client
    npx prisma generate
    
    # Push database schema (for development/staging)
    if [[ "$ENVIRONMENT" != "production" ]]; then
        print_status "Pushing database schema..."
        npx prisma db push
    else
        print_warning "Skipping database push in production (use migrations)"
    fi
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Install with: npm i -g vercel"
        exit 1
    fi
    
    case $ENVIRONMENT in
        development)
            vercel --dev
            ;;
        staging)
            vercel --target staging
            ;;
        production)
            vercel --prod
            ;;
    esac
}

# Deploy with Docker
deploy_docker() {
    print_status "Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Build Docker image
    docker build -t plugpost:$ENVIRONMENT .
    
    # Stop existing container
    docker stop plugpost-$ENVIRONMENT 2>/dev/null || true
    docker rm plugpost-$ENVIRONMENT 2>/dev/null || true
    
    # Run new container
    docker run -d \
        --name plugpost-$ENVIRONMENT \
        --env-file .env.$ENVIRONMENT \
        -p 3000:3000 \
        plugpost:$ENVIRONMENT
}

# Deploy with Docker Compose
deploy_docker_compose() {
    print_status "Deploying with Docker Compose..."
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Use environment-specific compose file if it exists
    COMPOSE_FILE="docker-compose.yml"
    if [ -f "docker-compose.$ENVIRONMENT.yml" ]; then
        COMPOSE_FILE="docker-compose.$ENVIRONMENT.yml"
    fi
    
    docker-compose -f $COMPOSE_FILE down
    docker-compose -f $COMPOSE_FILE up -d --build
}

# Main deployment function
deploy() {
    if [ "$BUILD_ONLY" = true ]; then
        print_status "Build-only mode, skipping deployment"
        return
    fi
    
    print_status "Starting deployment..."
    
    # Check for deployment method
    if [ -f "vercel.json" ] && command -v vercel &> /dev/null; then
        deploy_vercel
    elif [ -f "docker-compose.yml" ]; then
        deploy_docker_compose
    elif [ -f "Dockerfile" ]; then
        deploy_docker
    else
        print_warning "No deployment method detected. Manual deployment required."
        print_status "Built files are ready in .next directory"
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    # Add any cleanup tasks here
}

# Main execution
main() {
    print_status "PlugPost Deployment Script"
    print_status "Environment: $ENVIRONMENT"
    
    # Set up error handling
    trap cleanup EXIT
    
    # Execute deployment steps
    check_dependencies
    install_dependencies
    run_tests
    build_application
    handle_database
    deploy
    
    print_status "Deployment completed successfully!"
}

# Run main function
main
