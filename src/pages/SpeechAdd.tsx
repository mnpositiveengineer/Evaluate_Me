import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, ArrowLeft, Check, AlertCircle, Loader2, Mic, Search } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { getAllSkills, getUserSkills, createSpeech, createSpeechSkills, Skill, UserSkill } from '../lib/supabase';

const SpeechAdd: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [speechData, setSpeechData] = useState({
    title: '',
    description: '',
    selectedSkills: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [allSkills, userSkillsData] = await Promise.all([
        getAllSkills(),
        getUserSkills(user.id)
      ]);
      
      setSkills(allSkills);
      setUserSkills(userSkillsData);
      
      // Don't pre-select any skills - let user choose
      setSpeechData(prev => ({ ...prev, selectedSkills: [] }));
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load skills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillToggle = (skillId: string) => {
    setSpeechData(prev => {
      const isSelected = prev.selectedSkills.includes(skillId);
      
      if (isSelected) {
        // Remove skill
        return {
          ...prev,
          selectedSkills: prev.selectedSkills.filter(id => id !== skillId)
        };
      } else {
        // Add skill only if under limit
        if (prev.selectedSkills.length >= 5) {
          setError('You can select a maximum of 5 skills to focus on');
          return prev;
        }
        
        // Clear error when adding skill
        if (error && error.includes('maximum of 5 skills')) {
          setError(null);
        }
        
        return {
          ...prev,
          selectedSkills: [...prev.selectedSkills, skillId]
        };
      }
    });
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    // Validate form
    if (!speechData.title.trim()) {
      setError('Please enter a speech title');
      return;
    }

    if (speechData.selectedSkills.length === 0) {
      setError('Please select at least one skill to practice');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Create the speech record
      console.log('Creating speech:', speechData);
      
      const newSpeech = await createSpeech({
        user_id: user.id,
        title: speechData.title.trim(),
        description: speechData.description.trim() || undefined
      });
      
      console.log('Speech created:', newSpeech);
      
      // Create speech-skill associations
      const speechSkillsData = speechData.selectedSkills.map(skillId => ({
        speech_id: newSpeech.id,
        skill_id: skillId
      }));
      
      await createSpeechSkills(speechSkillsData);
      console.log('Speech skills created successfully');
      
      // Navigate back to speeches page
      navigate('/speeches');
    } catch (error) {
      console.error('Error creating speech:', error);
      setError('Failed to create speech. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter skills based on search term
  const filteredSkills = skills.filter(skill => 
    skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUserSkills = userSkills.filter(userSkill => 
    userSkill.skill?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userSkill.skill?.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    userSkill.skill?.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && skills.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/speeches')}
          className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Add New Speech</h2>
          <p className="text-slate-600">Add a speech to your list for evaluation and feedback</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <div className="space-y-8">
          {/* Speech Details Section */}
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Speech Details</h3>
              <p className="text-slate-600">Tell us about your speech and what skills you want to practice</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Speech Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={speechData.title}
                onChange={(e) => setSpeechData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a descriptive title for your speech"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description <span className="text-slate-400">(Optional)</span>
              </label>
              <textarea
                value={speechData.description}
                onChange={(e) => setSpeechData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe what your speech is about, the context, or any specific areas you'd like feedback on..."
              />
            </div>
          </div>

          {/* Search Field */}
          <div className="space-y-6 pt-8 border-t border-slate-200">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search skills by name, description, or category..."
              />
            </div>
          </div>

          {/* Skills Selection Section */}
          <div className="space-y-6">
            <div className="text-center">
              <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Select Skills to Practice</h3>
              <p className="text-slate-600">Choose up to 5 skills you want to focus on and receive feedback for</p>
            </div>

            {/* User's Skills (at the top) */}
            {filteredUserSkills.length > 0 && (
              <div className="mb-8">
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Your Skills
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredUserSkills.map((userSkill) => {
                    const skill = userSkill.skill;
                    if (!skill) return null;
                    
                    return (
                      <div
                        key={skill.id}
                        onClick={() => handleSkillToggle(skill.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          speechData.selectedSkills.includes(skill.id)
                            ? 'border-blue-500 bg-blue-50'
                            : speechData.selectedSkills.length >= 5
                            ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
                            : 'border-slate-200 hover:border-blue-300 cursor-pointer'
                        } ${speechData.selectedSkills.includes(skill.id) || speechData.selectedSkills.length < 5 ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{skill.icon}</span>
                            <div>
                              <h5 className="font-medium text-slate-800">{skill.name}</h5>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-slate-600">Level {userSkill.current_level}/10</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  skill.difficulty === 'Beginner' ? 'bg-green-100 text-green-600' :
                                  skill.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-red-100 text-red-600'
                                }`}>
                                  {skill.difficulty}
                                </span>
                              </div>
                            </div>
                          </div>
                          {speechData.selectedSkills.includes(skill.id) && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Other Skills */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center">
                <span className="w-2 h-2 bg-slate-400 rounded-full mr-2"></span>
                All Available Skills
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                {filteredSkills.filter(skill => !userSkills.some(us => us.skill_id === skill.id)).map((skill) => (
                  <div
                    key={skill.id}
                    onClick={() => handleSkillToggle(skill.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      speechData.selectedSkills.includes(skill.id)
                        ? 'border-blue-500 bg-blue-50'
                        : speechData.selectedSkills.length >= 5
                        ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
                        : 'border-slate-200 hover:border-blue-300 cursor-pointer'
                    } ${speechData.selectedSkills.includes(skill.id) || speechData.selectedSkills.length < 5 ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{skill.icon}</span>
                        <div>
                          <h5 className="font-medium text-slate-800">{skill.name}</h5>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-600">{skill.category}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              skill.difficulty === 'Beginner' ? 'bg-green-100 text-green-600' :
                              skill.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {skill.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                      {speechData.selectedSkills.includes(skill.id) && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selection Summary */}
            <div className={`rounded-lg p-4 border ${
              speechData.selectedSkills.length >= 5 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <p className={`text-sm ${
                speechData.selectedSkills.length >= 5 ? 'text-orange-700' : 'text-blue-700'
              }`}>
                <strong>Selected {speechData.selectedSkills.length}/5 skill{speechData.selectedSkills.length !== 1 ? 's' : ''}.</strong> 
                {speechData.selectedSkills.length === 0 && ' Please select at least one skill to get targeted feedback.'}
                {speechData.selectedSkills.length > 0 && speechData.selectedSkills.length < 5 && ' You can select more skills or continue with your current selection.'}
                {speechData.selectedSkills.length >= 5 && ' You\'ve reached the maximum number of skills. Remove some to select others.'}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-between pt-8 border-t border-slate-200">
            <button
              onClick={() => navigate('/speeches')}
              disabled={submitting}
              className="flex items-center space-x-2 px-6 py-3 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting || !speechData.title.trim() || speechData.selectedSkills.length === 0}
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding Speech...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Add Speech</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechAdd;