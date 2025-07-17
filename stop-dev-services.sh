#!/bin/bash

echo "🛑 Stopping DEX Mobile v6 Development Services"
echo "============================================="

if [ -f ".dev-services.pids" ]; then
    while read pid; do
        if [ ! -z "$pid" ]; then
            if kill -0 $pid 2>/dev/null; then
                echo "🔄 Stopping process $pid..."
                kill $pid
            else
                echo "⚠️  Process $pid not running"
            fi
        fi
    done < .dev-services.pids
    
    rm -f .dev-services.pids
    echo "✅ All services stopped"
else
    echo "⚠️  No PID file found"
fi

# Kill any remaining processes on our ports
echo "🧹 Cleaning up ports..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:4001 | xargs kill -9 2>/dev/null || true
lsof -ti:4002 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true

echo "✅ Cleanup complete"
