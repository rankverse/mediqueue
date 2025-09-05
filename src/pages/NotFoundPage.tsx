import React from 'react';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export const NotFoundPage: React.FC = () => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardContent className="pt-12 pb-12 text-center">
          {/* 404 Animation */}
          <div className="mb-8">
            <div className="text-8xl font-bold text-blue-600 mb-4 animate-bounce">404</div>
            <div className="text-6xl mb-6">🏥</div>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Don't worry, let's get you back to the right place!
          </p>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-colors cursor-pointer" onClick={handleGoHome}>
              <CardContent className="pt-6 pb-6">
                <Home className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Home Page</h3>
                <p className="text-sm text-gray-600">Book your appointment</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100 hover:border-green-300 transition-colors cursor-pointer" onClick={() => window.location.href = '/admin'}>
              <CardContent className="pt-6 pb-6">
                <Search className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Admin Panel</h3>
                <p className="text-sm text-gray-600">Manage appointments</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors cursor-pointer" onClick={() => window.location.href = '/doctor'}>
              <CardContent className="pt-6 pb-6">
                <HelpCircle className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Doctor Room</h3>
                <p className="text-sm text-gray-600">Consultation portal</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleGoBack} variant="outline" size="lg">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Go Back
            </Button>
            <Button onClick={handleGoHome} size="lg">
              <Home className="h-5 w-5 mr-2" />
              Go to Home
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact support or try refreshing the page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};