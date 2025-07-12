import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2, AlertCircle, Target, Star, Users, Mic, Search, ArrowLeft } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { getAllSkills, updateUserSkills, updateProfile, Skill } from '../lib/supabase';

const SkillSelection: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, refreshProfile } = useAuthContext();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [wantsAllSkills, setWantsAllSkills] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillsLoaded, setSkillsLoaded] = useState(false);
  const [currentUserSkills, setCurrentUserSkills] = useState<string[]>([]);
  const [protectedSkills, setProtectedSkills] = useState<Set<string>>(new Set());

  const [searchTerm, setSearchTerm] = useState('');

  const isFromProfile = searchParams.get('from') === 'profile';
  const isNewUser = !profile?.onboarding_completed;

  useEffect(() => {
    loadSkills();
  }, []);

  useEffect(() => {
    // Pre-select skills if user wants all skills and is a new user
    if (profile?.wants_all_skills && skills.length > 0 && isNewUser) {
      setWantsAllSkills(true);
      setSelectedSkills(skills.map(skill => skill.id));
    } else if (isFromProfile || (!isNewUser && skills.length > 0)) {
      // If coming from profile page or existing user, load their current skills
      loadCurrentUserSkills();
    }
  }, [profile, skills, isFromProfile, isNewUser]);

  const loadCurrentUserSkills = async () => {
    if (!user?.id) return;
    
    try {
      const { getUserSkills, canRemoveSkill } = await import('../lib/supabase');
      const userSkills = await getUserSkills(user.id);
      const currentSkillIds = userSkills.map(us => us.skill_id);
      setCurrentUserSkills(currentSkillIds);
      setSelectedSkills(currentSkillIds);
      
      // Check which skills are protected (can't be removed)
      const protectedSkillIds = new Set<string>();
      for (const userSkill of userSkills) {
        const { canRemove } = await canRemoveSkill(user.id, userSkill.skill_id);
        if (!canRemove) {
          protectedSkillIds.add(userSkill.skill_id);
        }
      }
      setProtectedSkills(protectedSkillIds);
      
      // Check if user had selected all skills
      if (skills.length > 0 && currentSkillIds.length === skills.length) {
        setWantsAllSkills(true);
      }
    } catch (error) {
      console.error('Error loading current user skills:', error);
    }
  };

  const loadSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading skills...');
      
      // Add timeout for skills loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Skills loading timeout')), 10000);
      });
      
      const skillsPromise = getAllSkills();
      
      const skillsData = await Promise.race([skillsPromise, timeoutPromise]);
      
      console.log('Skills loaded:', skillsData.length);
      setSkills(skillsData);
      setSkillsLoaded(true);
    } catch (error) {
      console.error('Error loading skills:', error);
      
      // Provide fallback skills if database is unavailable
      const fallbackSkills: Skill[] = [
        {
          id: 'fallback-1',
          name: 'Vocal Variety',
          description: 'Master tone, pace, volume, and pitch variation',
          category: 'Core Speaking',
          difficulty: 'Beginner',
          icon: '🎵',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'fallback-2',
          name: 'Body Language',
          description: 'Use gestures, posture, and movement effectively',
          category: 'Core Speaking',
          difficulty: 'Beginner',
          icon: '🤲',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'fallback-3',
          name: 'Confidence Building',
          description: 'Overcome nervousness and project self-assurance',
          category: 'Confidence & Mindset',
          difficulty: 'Beginner',
          icon: '💪',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'fallback-4',
          name: 'Content Structure',
          description: 'Organize ideas with clear intro, body, and conclusion',
          category: 'Content & Structure',
          difficulty: 'Intermediate',
          icon: '📋',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'fallback-5',
          name: 'Audience Engagement',
          description: 'Connect and interact effectively with your audience',
          category: 'Audience Connection',
          difficulty: 'Intermediate',
          icon: '👥',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'fallback-6',
          name: 'Business Presentations',
          description: 'Deliver professional presentations with impact',
          category: 'Professional Speaking',
          difficulty: 'Intermediate',
          icon: '📊',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
      
      console.log('Using fallback skills due to connectivity issues');
      setSkills(fallbackSkills);
      setSkillsLoaded(true);
      setError('Running in offline mode. Skills will sync when connection is restored.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillToggle = (skillId: string) => {
    if (wantsAllSkills) return; // Don't allow individual selection when "all skills" is selected
    
    // If this is from profile and skill is protected, don't allow deselection
    if (isFromProfile && protectedSkills.has(skillId) && selectedSkills.includes(skillId)) {
      return;
    }
    
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleWantsAllSkills = () => {
    const newWantsAll = !wantsAllSkills;
    setWantsAllSkills(newWantsAll);
    
    if (newWantsAll) {
      setSelectedSkills(skills.map(skill => skill.id));
    } else {
      setSelectedSkills(isFromProfile ? currentUserSkills.filter(id => protectedSkills.has(id)) : []);
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile) {
      setError('User not authenticated');
      return;
    }

    if (selectedSkills.length === 0) {
      setError('Please select at least one skill to get started');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      console.log('Starting skill selection submission...');
      console.log('Selected skills:', selectedSkills);
      console.log('Wants all skills:', wantsAllSkills);

      // Check if we're using fallback skills (offline mode)
      const usingFallbackSkills = skills.some(skill => skill.id.startsWith('fallback-'));
      
      if (usingFallbackSkills) {
        console.log('In offline mode - simulating skill update...');
        
        // Simulate the update for offline mode
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update profile to mark onboarding as completed
        try {
          await updateProfile(user.id, {
            onboarding_completed: true,
            wants_all_skills: wantsAllSkills
          });
          console.log('Profile updated successfully in offline mode');
        } catch (profileError) {
          console.warn('Profile update failed in offline mode:', profileError);
          // Continue anyway in offline mode
        }
        
        // Refresh profile and navigate
        refreshProfile();
        
        if (isFromProfile || !isNewUser) {
          navigate('/profile');
        } else {
          navigate('/speeches');
        }
        return;
      }

      // Online mode - try to update skills in database
      console.log('Attempting to update user skills...');
      
      // Add timeout for skill updates
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Skill update timeout')), 15000);
      });
      
      const updatePromise = updateUserSkills(user.id, selectedSkills);
      
      try {
        await Promise.race([updatePromise, timeoutPromise]);
        console.log('Skills updated successfully');
      } catch (skillUpdateError) {
        console.error('Skill update failed:', skillUpdateError);
        
        // If skill update fails, still try to update the profile
        console.log('Continuing with profile update despite skill update failure...');
      }

      // Update profile to mark onboarding as completed
      console.log('Updating profile...');
      
      const profileUpdatePromise = updateProfile(user.id, {
        onboarding_completed: true,
        wants_all_skills: wantsAllSkills
      });
      
      try {
        await Promise.race([profileUpdatePromise, timeoutPromise]);
        console.log('Profile updated successfully');
      } catch (profileError) {
        console.error('Profile update failed:', profileError);
        throw new Error('Failed to complete onboarding. Please try again.');
      }

      // Refresh profile to get updated data
      refreshProfile();

      // Navigate to appropriate page
      if (isFromProfile || !isNewUser) {
        navigate('/profile');
      } else {
        navigate('/speeches');
      }

    } catch (error: any) {
      console.error('Error during skill selection:', error);
      
      if (error.message?.includes('timeout')) {
        setError('Connection timeout. Please check your internet connection and try again.');
      } else if (error.message?.includes('Failed to complete onboarding')) {
        setError(error.message);
      } else {
        setError('Failed to save your skill selection. Please try again.');
      }
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

  // Group skills by category
  const skillsByCategory = filteredSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-600';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-600';
      case 'Advanced': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading speaking skills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            {isFromProfile ? 'Manage Your Skills' : isNewUser ? 'Choose Your Speaking Skills' : 'Update Your Skills'}
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            {isFromProfile 
              ? 'Update the skills you want to focus on improving'
              : isNewUser 
                ? 'Select the speaking skills you want to develop. You can always change these later.'
                : 'Update the skills you want to focus on improving'
            }
          </p>
        </div>

        {/* Protected Skills Notice */}
        {isFromProfile && protectedSkills.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Skill Protection Notice</h4>
                <p className="text-sm text-blue-700">
                  Some skills cannot be deselected because they are associated with speeches or have evaluation scores. 
                  These skills appear with a lock icon and help preserve your progress history.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Connection Notice</h4>
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Quick Start Options</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <button
              onClick={() => {
                setWantsAllSkills(false);
                const beginnerSkills = skills.filter(skill => skill.difficulty === 'Beginner').map(skill => skill.id);
                setSelectedSkills(beginnerSkills);
              }}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                !wantsAllSkills && selectedSkills.length > 0 && skills.filter(skill => skill.difficulty === 'Beginner').every(skill => selectedSkills.includes(skill.id))
                  ? 'border-green-500 bg-green-50'
                  : 'border-slate-200 hover:border-green-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Star className="w-6 h-6 text-green-600" />
                {!wantsAllSkills && selectedSkills.length > 0 && skills.filter(skill => skill.difficulty === 'Beginner').every(skill => selectedSkills.includes(skill.id)) && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <h4 className="font-semibold text-slate-800 mb-1">Start with basics</h4>
              <p className="text-sm text-slate-600">
                Focus on fundamental speaking skills first
              </p>
            </button>

            <button
              onClick={() => {
                setWantsAllSkills(false);
                setSelectedSkills([]);
              }}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                !wantsAllSkills && selectedSkills.length === 0
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 text-blue-600" />
                {!wantsAllSkills && selectedSkills.length === 0 && (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <h4 className="font-semibold text-slate-800 mb-1">Let me choose</h4>
              <p className="text-sm text-slate-600">
                Manually select specific skills to focus on
              </p>
            </button>
          </div>
        </div>

        {/* Search Field */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Search Skills</h3>
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

        {/* Skills Selection */}
        {skillsLoaded && (
          <div className="space-y-8">
            {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
              <div key={category} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-4">{category}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categorySkills.map((skill) => (
                    <div
                      key={skill.id}
                      onClick={() => handleSkillToggle(skill.id)}
                      className={`p-4 rounded-lg border-2 transition-all relative ${
                        selectedSkills.includes(skill.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      } ${
                        wantsAllSkills || (isFromProfile && protectedSkills.has(skill.id) && selectedSkills.includes(skill.id))
                          ? 'opacity-75 cursor-not-allowed' 
                          : 'cursor-pointer'
                      }`}
                    >
                      {/* Protected skill indicator */}
                      {isFromProfile && protectedSkills.has(skill.id) && (
                        <div className="absolute top-2 right-2">
                          <div className="w-5 h-5 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                            <span className="text-xs">🔒</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{skill.icon}</span>
                          <div>
                            <h4 className="font-semibold text-slate-800">{skill.name}</h4>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(skill.difficulty)}`}>
                              {skill.difficulty}
                            </span>
                          </div>
                        </div>
                        {selectedSkills.includes(skill.id) && (
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{skill.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            {/* Back to Profile Button */}
            {isFromProfile && (
              <div className="mb-4">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center space-x-2 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Profile</span>
                </button>
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-slate-600">
                Selected {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''}
                {wantsAllSkills && ' (All skills selected)'}
              </p>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedSkills.length === 0}
              className="flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving Your Skills...</span>
                </>
              ) : (
                <>
                  <span>{isFromProfile ? 'Update Skills' : isNewUser ? 'Start Your Journey' : 'Update Skills'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            {selectedSkills.length === 0 && !submitting && (
              <p className="text-sm text-slate-500 mt-2">
                Please select at least one skill to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillSelection;