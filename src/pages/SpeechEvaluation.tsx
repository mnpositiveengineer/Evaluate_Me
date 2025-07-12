import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Send, ArrowLeft, User, CheckCircle, AlertCircle, QrCode, Loader2, X } from 'lucide-react';
import { getSpeechByShareToken, getSpeechSkills, createEvaluation, createEvaluationSkillScores, Speech, SpeechSkill } from '../lib/supabase';

interface EvaluationForm {
  skillScores: Record<string, number>;
  whatWentWell: string;
  whatCouldBeImproved: string;
  evaluatorName: string;
}

const SpeechEvaluation: React.FC = () => {
  const { id } = useParams();
  const [speech, setSpeech] = useState<Speech | null>(null);
  const [speechSkills, setSpeechSkills] = useState<SpeechSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationForm>({
    skillScores: {},
    whatWentWell: '',
    whatCouldBeImproved: '',
    evaluatorName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      loadSpeechData();
    }
  }, [id]);

  const loadSpeechData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load speech by share token
      const speechData = await getSpeechByShareToken(id);
      if (!speechData) {
        setError('Speech not found or not available for evaluation');
        return;
      }
      
      setSpeech(speechData);
      
      // Load speech skills
      const skills = await getSpeechSkills(speechData.id);
      setSpeechSkills(skills);
      
    } catch (error) {
      console.error('Error loading speech data:', error);
      setError('Failed to load speech data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillScore = (skillId: string, score: number) => {
    setEvaluation(prev => ({
      ...prev,
      skillScores: {
        ...prev.skillScores,
        [skillId]: score
      }
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    // Evaluator name is required
    if (!evaluation.evaluatorName.trim()) {
      errors.push('Please enter your name');
    }

    // Check if all skills have been scored
    const unscoredSkills = speechSkills.filter(speechSkill => 
      !evaluation.skillScores[speechSkill.skill_id] || evaluation.skillScores[speechSkill.skill_id] < 1
    );
    
    if (unscoredSkills.length > 0) {
      errors.push('Please rate all skills (1-5 stars each)');
    }

    return errors;
  };

  const handleSubmitEvaluation = async () => {
    if (!speech) return;
    
    const errors = validateForm();
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      // Create the evaluation
      const evaluationData = {
        speech_id: speech.id,
        evaluator_name: evaluation.evaluatorName.trim(),
        what_went_well: evaluation.whatWentWell.trim() || '',
        what_could_be_improved: evaluation.whatCouldBeImproved.trim() || ''
      };

      console.log('Creating evaluation:', evaluationData);
      const newEvaluation = await createEvaluation(evaluationData);
      console.log('Evaluation created:', newEvaluation);

      // Create skill scores
      if (Object.keys(evaluation.skillScores).length > 0) {
        const skillScoresData = Object.entries(evaluation.skillScores).map(([skillId, score]) => ({
          evaluation_id: newEvaluation.id,
          skill_id: skillId,
          score: score
        }));

        console.log('Creating skill scores:', skillScoresData);
        await createEvaluationSkillScores(skillScoresData);
        console.log('Skill scores created successfully');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      setValidationErrors(['Error submitting evaluation. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseThankYou = () => {
    // Navigate to landing page
    window.location.href = '/landing';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading speech data...</p>
        </div>
      </div>
    );
  }

  if (error || !speech) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Speech Not Found</h1>
          <p className="text-slate-600 mb-8">
            {error || 'The speech you\'re trying to evaluate could not be found or is not available for evaluation.'}
          </p>
          
          <Link
            to="/landing"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">Thank You!</h1>
              <p className="text-slate-600 mb-6">
                Your evaluation for "{speech.title}" has been submitted successfully. Your feedback will help the speaker improve their skills.
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-slate-800 mb-3">Your Contribution</h3>
              <div className="space-y-2 text-sm">
                {Object.keys(evaluation.skillScores).length > 0 && (
                  <div className="flex justify-between">
                    <span>Skills Rated:</span>
                    <span className="font-medium">{Object.keys(evaluation.skillScores).length}</span>
                  </div>
                )}
                {evaluation.whatWentWell && (
                  <div className="flex justify-between">
                    <span>Positive Feedback:</span>
                    <span className="font-medium text-green-600">✓</span>
                  </div>
                )}
                {evaluation.whatCouldBeImproved && (
                  <div className="flex justify-between">
                    <span>Improvement Areas:</span>
                    <span className="font-medium text-blue-600">✓</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCloseThankYou}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium"
              >
                Close
              </button>
              <p className="text-sm text-slate-500 text-center">
                Want to improve your own speaking skills? Join our community!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/landing"
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors p-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Join Evaluate me!</span>
            </Link>
            
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs sm:text-sm">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">QR Code Evaluation</span>
              <span className="sm:hidden">QR</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="mb-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-2 leading-tight">{speech.title}</h1>
              {speech.description && (
                <p className="text-slate-600 mb-4">{speech.description}</p>
              )}
            </div>

            {/* Skills Associated with Speech */}
            {speechSkills.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Skills being practiced:</h3>
                <div className="flex flex-wrap gap-2">
                  {speechSkills.map((speechSkill) => (
                    <div key={speechSkill.id} className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-lg">{speechSkill.skill?.icon}</span>
                        <span className="font-medium text-blue-800 text-sm">{speechSkill.skill?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800 mb-2">Please complete the following:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Evaluation Form */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-2">Evaluate This Speech</h2>
            <p className="text-slate-600">
              Your feedback is valuable! Please rate each skill and provide your thoughts on what went well and what could be improved.
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Evaluator Information */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={evaluation.evaluatorName}
                onChange={(e) => {
                  setEvaluation(prev => ({ ...prev, evaluatorName: e.target.value }));
                  if (validationErrors.length > 0) setValidationErrors([]);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                placeholder="Enter your name"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Required field. Your name will be shown with your feedback.
              </p>
            </div>

            {/* Skill Ratings */}
            {speechSkills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Rate Skills <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Please rate how well the speaker performed in each skill area (1-5 stars).
                </p>
                <div className="space-y-4">
                  {speechSkills.map((speechSkill) => {
                    const skill = speechSkill.skill;
                    if (!skill) return null;
                    
                    return (
                      <div key={speechSkill.id} className="flex flex-col p-4 bg-slate-50 rounded-lg space-y-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">{skill.icon}</span>
                            <h4 className="font-medium text-slate-800">{skill.name}</h4>
                          </div>
                          <p className="text-sm text-slate-600">{skill.description}</p>
                        </div>
                        <div className="flex justify-center space-x-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => handleSkillScore(skill.id, rating)}
                              className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full transition-all ${
                                (evaluation.skillScores[skill.id] || 0) >= rating
                                  ? 'text-yellow-400 hover:text-yellow-500'
                                  : 'text-slate-300 hover:text-yellow-300'
                              }`}
                              title={`Rate ${rating} star${rating !== 1 ? 's' : ''}`}
                            >
                              <Star className="w-8 h-8 sm:w-6 sm:h-6 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback Sections */}
            <div className="space-y-6">
              {/* What Went Well */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What went well? <span className="text-slate-400">(Optional)</span>
                </label>
                <textarea
                  value={evaluation.whatWentWell}
                  onChange={(e) => {
                    setEvaluation(prev => ({ ...prev, whatWentWell: e.target.value }));
                    if (validationErrors.length > 0) setValidationErrors([]);
                  }}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
                  placeholder="What did the speaker do well? What was effective or engaging?"
                />
              </div>

              {/* What Could Be Improved */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What could be improved? <span className="text-slate-400">(Optional)</span>
                </label>
                <textarea
                  value={evaluation.whatCouldBeImproved}
                  onChange={(e) => {
                    setEvaluation(prev => ({ ...prev, whatCouldBeImproved: e.target.value }));
                    if (validationErrors.length > 0) setValidationErrors([]);
                  }}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
                  placeholder="What areas could use some development? Be constructive and specific."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col items-center pt-6 border-t border-slate-200">
              <button
                onClick={handleSubmitEvaluation}
                disabled={isSubmitting || !evaluation.evaluatorName.trim() || speechSkills.some(ss => !evaluation.skillScores[ss.skill_id])}
                className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-base font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Evaluation</span>
                  </>
                )}
              </button>
              
              <p className="text-sm text-slate-500 mt-3 text-center">
                Your feedback will help the speaker improve their skills.<br />
                Thank you for taking the time to provide constructive feedback!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechEvaluation;