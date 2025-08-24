import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Settings,
  Shield,
  Bell,
  ArrowLeft,
  Edit
} from 'lucide-react';
import { UserProfileManager } from '@/components/auth/UserProfileManager';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { user, session } = useAuth();

  if (!user || !session) {
    return (
      <div className="min-h-screen bg-dex-background flex items-center justify-center">
        <Card className="bg-dex-card border-dex-primary/20 max-w-md">
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-dex-text-secondary" />
            <h2 className="text-xl font-semibold text-dex-text-primary mb-2">
              Authentication Required
            </h2>
            <p className="text-dex-text-secondary mb-4">
              Please sign in to view your profile.
            </p>
            <Link to="/auth">
              <Button className="w-full">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dex-background">
      {/* Header */}
      <div className="border-b border-dex-secondary/20 bg-dex-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>

              <div className="flex items-center gap-2">
                <User className="h-6 w-6 text-dex-primary" />
                <h1 className="text-2xl font-bold text-dex-text-primary font-poppins">
                  Profile Settings
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="w-2 h-2 bg-dex-positive rounded-full animate-pulse" />
                Online
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <UserProfileManager />
      </div>

      {/* Footer */}
      <div className="border-t border-dex-secondary/20 bg-dex-card/30 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-dex-text-secondary">
            <div className="flex items-center gap-4">
              <span>© 2024 DEX Web v6</span>
              <span>•</span>
              <span>Secure Profile Management</span>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/privacy-policy" className="hover:text-dex-text-primary transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/terms-of-service" className="hover:text-dex-text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
