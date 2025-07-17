#!/bin/bash

echo "🚀 Starting DEX Mobile v6 Development Services"
echo "=============================================="

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Function to start service with retry
start_service() {
    local service_name=$1
    local command=$2
    local port=$3
    
    echo "🔄 Starting $service_name on port $port..."
    
    if check_port $port; then
        eval "$command" &
        local pid=$!
        echo "✅ $service_name started with PID: $pid"
        echo "$pid" >> .dev-services.pids
        sleep 2
        
        # Verify service started
        if lsof -i :$port > /dev/null 2>&1; then
            echo "✅ $service_name is running on port $port"
        else
            echo "❌ $service_name failed to start"
        fi
    fi
}

# Clean up any existing PID file
rm -f .dev-services.pids

echo "📋 Checking port availability..."
check_port 8080
check_port 4001
check_port 4002
check_port 4000

echo ""
echo "🔧 Starting backend services..."

# Start KYC service (if available)
if [ -d "services" ]; then
    cd services
    if [ -f "package.json" ]; then
        echo "🔐 Starting KYC/AML services..."
        npm run dev &
        echo $! >> ../.dev-services.pids
        cd ..
    else
        echo "⚠️  KYC services not configured"
        cd ..
    fi
else
    echo "⚠️  Services directory not found"
fi

# Start chart service (if available)
if [ -d "chart-api-service" ]; then
    cd chart-api-service
    if [ -f "package.json" ]; then
        echo "📊 Starting chart service..."
        npm run dev &
        echo $! >> ../.dev-services.pids
        cd ..
    else
        echo "⚠️  Chart service not configured"
        cd ..
    fi
else
    echo "⚠️  Chart service directory not found"
fi

echo ""
echo "🌐 Starting main application..."

# Start main Vite dev server
npm run dev &
MAIN_PID=$!
echo $MAIN_PID >> .dev-services.pids

echo ""
echo "🎉 Development environment started!"
echo "=================================="
echo "📱 Main App: http://localhost:8080"
echo "🌐 Network Access: http://$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}'):8080"
echo "🔐 KYC Service: http://localhost:4001"
echo "📊 Chart Service: http://localhost:4000"
echo ""
echo "🛑 To stop all services: ./stop-dev-services.sh"
echo "📋 Service PIDs saved to: .dev-services.pids"

# Wait for main process
wait $MAIN_PID
