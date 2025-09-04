import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  X, 
  Calendar, 
  QrCode, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Smartphone,
  Users,
  Heart
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Modal } from './ui/Modal';

interface InteractiveGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  animation: string;
  tips: string[];
}

export const InteractiveGuide: React.FC<InteractiveGuideProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  const steps: GuideStep[] = [
    {
      id: 1,
      title: "Welcome to MediQueue",
      description: "Skip the waiting room! Book your appointment token online and track your queue position in real-time.",
      icon: <Heart className="h-12 w-12 text-red-500" />,
      animation: "animate-pulse",
      tips: [
        "No more waiting in crowded rooms",
        "Get instant confirmation",
        "Track your position live"
      ]
    },
    {
      id: 2,
      title: "Book Your Token",
      description: "Fill out a simple form with your details and select your preferred department. It takes less than 2 minutes!",
      icon: <Calendar className="h-12 w-12 text-blue-500" />,
      animation: "animate-bounce",
      tips: [
        "Quick 2-minute booking process",
        "Choose your preferred department",
        "Optional payment online or at clinic"
      ]
    },
    {
      id: 3,
      title: "Get Your QR Code",
      description: "Receive your unique QR code and token number instantly. Save it to your phone for easy access.",
      icon: <QrCode className="h-12 w-12 text-green-500" />,
      animation: "animate-spin",
      tips: [
        "Unique QR code for security",
        "Download and save to phone",
        "Works offline once saved"
      ]
    },
    {
      id: 4,
      title: "Track Live Queue",
      description: "Monitor your position and estimated wait time in real-time. Know exactly when to arrive at the clinic.",
      icon: <Clock className="h-12 w-12 text-purple-500" />,
      animation: "animate-pulse",
      tips: [
        "Real-time position updates",
        "Accurate wait time estimates",
        "Arrive exactly when needed"
      ]
    },
    {
      id: 5,
      title: "Quick Check-in",
      description: "Show your QR code at the clinic reception for instant, contactless check-in. No paperwork needed!",
      icon: <CheckCircle className="h-12 w-12 text-emerald-500" />,
      animation: "animate-bounce",
      tips: [
        "Contactless check-in process",
        "No paperwork required",
        "Instant confirmation"
      ]
    }
  ];

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && autoPlay) {
      interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 4000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, autoPlay, steps.length]);

  const nextStep = () => {
    setCurrentStep(prev => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setCurrentStep(prev => (prev - 1 + steps.length) % steps.length);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    setAutoPlay(!isPlaying);
  };

  const currentStepData = steps[currentStep];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How MediQueue Works" size="lg">
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>

        {/* Step Counter */}
        <div className="text-center">
          <span className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        {/* Main Content */}
        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className={`mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg ${currentStepData.animation}`}>
                {currentStepData.icon}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900">
                {currentStepData.title}
              </h3>

              {/* Description */}
              <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
                {currentStepData.description}
              </p>

              {/* Tips */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 mr-2 text-blue-500" />
                  Key Benefits
                </h4>
                <ul className="space-y-2">
                  {currentStepData.tips.map((tip, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <Button
            onClick={prevStep}
            variant="outline"
            size="sm"
            disabled={currentStep === 0}
          >
            <SkipBack className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              onClick={togglePlay}
              variant={isPlaying ? "danger" : "secondary"}
              size="sm"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Auto Play
                </>
              )}
            </Button>

            {/* Step Indicators */}
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentStep 
                      ? 'bg-blue-500 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={nextStep}
            variant="outline"
            size="sm"
            disabled={currentStep === steps.length - 1}
          >
            Next
            <SkipForward className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Close Guide
          </Button>
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Start Booking
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep(steps.length - 1)}
              className="flex-1"
            >
              Skip to End
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};