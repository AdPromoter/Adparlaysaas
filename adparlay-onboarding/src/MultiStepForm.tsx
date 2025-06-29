import React, { useRef } from "react";
import { useFormContext } from "./FormContext";
import { useFirebase } from "./FirebaseContext";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";

const interestOptions = [
  "2 Seasons Residential",
  "True Vine Lakefront Villas",
  "True Vine Lake Front Plots"
];

const optionOptions = {
  "2 Seasons Residential": ["Buy Now", "Buy Now and Build", "Note My Interest"],
  "True Vine Lakefront Villas": ["Buy Now", "Buy Now and Build", "Note My Interest"],
  "True Vine Lake Front Plots": ["500 sqm", "1000 sqm", "1500 sqm"]
};

const plotOptions = {
  "500 sqm": ["Buy Now and Build", "Buy Now and Build Later", "Buy Now and Sell Later", "Note My Interest"],
  "1000 sqm": ["Buy Now and Build", "Buy Now and Build Later", "Buy Now and Sell Later", "Note My Interest"],
  "1500 sqm": ["Buy Now and Build", "Buy Now and Build Later", "Buy Now and Sell Later", "Note My Interest"]
};

const finalOptions = {
  "Buy Now": ["Proceed to Payment", "Schedule Viewing", "Note My Interest"],
  "Buy Now and Build": ["Proceed to Payment", "Schedule Viewing", "Note My Interest"],
  "Note My Interest": ["Schedule Viewing", "Request More Information", "Contact Sales Team"]
};

const MultiStepForm: React.FC = () => {
  const { formData, currentStep, prevStep, plotSize, updateFormData, nextStep, goToPrevStep } = useFormContext();
  const { saveFormResponse } = useFirebase();
  const summaryRef = useRef<HTMLDivElement>(null);

  const handleNext = async () => {
    if (currentStep === 5) {
      try {
        await saveFormResponse(formData);
        nextStep();
      } catch (error) {
        console.error("Error saving form response:", error);
        nextStep(); // Continue anyway for demo
      }
    } else {
      nextStep();
    }
  };

  const handleDownload = async () => {
    if (summaryRef.current) {
      try {
        const canvas = await html2canvas(summaryRef.current, {
          background: "#ffffff",
          useCORS: true,
          allowTaint: true
        });
        
        const link = document.createElement('a');
        link.download = `adparlay-summary-${formData.name}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        console.error("Error generating image:", error);
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-800">Welcome to Adparlay</h2>
            <p className="text-gray-600">Please provide your basic information to get started.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData({ email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData({ phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-800">What interests you?</h2>
            <p className="text-gray-600">Select the property type that interests you most.</p>
            
            <div className="grid gap-4">
              {interestOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    updateFormData({ interest: option, option: '', plotSize: '', finalOption: '' });
                    nextStep();
                  }}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <h3 className="font-semibold text-gray-800">{option}</h3>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        const options = optionOptions[formData.interest as keyof typeof optionOptions] || [];
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-800">Choose your option</h2>
            <p className="text-gray-600">Select your preferred option for {formData.interest}.</p>
            
            <div className="grid gap-4">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    if (formData.interest === "True Vine Lake Front Plots") {
                      updateFormData({ plotSize: option });
                    } else {
                      updateFormData({ option });
                    }
                    nextStep();
                  }}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <h3 className="font-semibold text-gray-800">{option}</h3>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 4:
        const plotOptionsList = plotOptions[formData.plotSize as keyof typeof plotOptions] || [];
        const finalOptionsList = finalOptions[formData.option as keyof typeof finalOptions] || [];
        const currentOptions = formData.interest === "True Vine Lake Front Plots" ? plotOptionsList : finalOptionsList;
        
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-800">Final selection</h2>
            <p className="text-gray-600">Choose your final option.</p>
            
            <div className="grid gap-4">
              {currentOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    updateFormData({ finalOption: option });
                    nextStep();
                  }}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <h3 className="font-semibold text-gray-800">{option}</h3>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-800">Review your selections</h2>
            <p className="text-gray-600">Please review your information before submitting.</p>
            
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div>
                <span className="font-semibold">Name:</span> {formData.name}
              </div>
              <div>
                <span className="font-semibold">Email:</span> {formData.email}
              </div>
              <div>
                <span className="font-semibold">Phone:</span> {formData.phone}
              </div>
              <div>
                <span className="font-semibold">Interest:</span> {formData.interest}
              </div>
              {formData.plotSize && (
                <div>
                  <span className="font-semibold">Plot Size:</span> {formData.plotSize}
                </div>
              )}
              {formData.option && (
                <div>
                  <span className="font-semibold">Option:</span> {formData.option}
                </div>
              )}
              <div>
                <span className="font-semibold">Final Choice:</span> {formData.finalOption}
              </div>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            key="step6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6 text-center"
          >
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-800">Thank you!</h2>
            <p className="text-gray-600">Your information has been submitted successfully.</p>
            
            <button
              onClick={handleDownload}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Download Summary
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Back Button */}
      {currentStep > 1 && currentStep < 6 && (
        <button
          onClick={goToPrevStep}
          className="absolute top-4 left-4 z-10 p-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div>
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        {currentStep < 5 && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && (!formData.name || !formData.email || !formData.phone)) ||
                (currentStep === 2 && !formData.interest) ||
                (currentStep === 3 && !formData.option && !formData.plotSize) ||
                (currentStep === 4 && !formData.finalOption)
              }
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {currentStep === 4 ? "Submit" : "Next"}
            </button>
          </div>
        )}
      </div>

      {/* Hidden summary for image generation */}
      <div ref={summaryRef} className="hidden">
        <div className="bg-white p-8 max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">2 Seasons</h1>
            <p className="text-gray-600">Property Interest Summary</p>
          </div>
          
          <div className="space-y-3 text-sm">
            <div><strong>Name:</strong> {formData.name}</div>
            <div><strong>Email:</strong> {formData.email}</div>
            <div><strong>Phone:</strong> {formData.phone}</div>
            <div><strong>Interest:</strong> {formData.interest}</div>
            {formData.plotSize && <div><strong>Plot Size:</strong> {formData.plotSize}</div>}
            {formData.option && <div><strong>Option:</strong> {formData.option}</div>}
            <div><strong>Final Choice:</strong> {formData.finalOption}</div>
          </div>
          
          <div className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
            <p>Generated on {new Date().toLocaleDateString()}</p>
            <p>2 Seasons - Your Trusted Property Partner</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiStepForm; 