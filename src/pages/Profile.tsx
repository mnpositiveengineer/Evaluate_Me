import React, { useState, useEffect } from 'react';
import { User, Star, Calendar, Edit2, Save, Settings, Shield, Trash2, Loader2, AlertCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../components/AuthProvider';
import { getUserSkills, updateProfile, UserSkill, removeUserSkill, getUserSkillEvaluationStats } from '../lib/supabase';

const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [skillEvaluationStats, setSkillEvaluationStats] = useState<{
    skillId: string;
    averageRating: number;
    evaluationCount: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRemovalModal, setShowRemovalModal] = useState(false);
  const [skillToRemove, setSkillToRemove] = useState<{ id: string; name: string } | null>(null);
  const [removalMessage, setRemovalMessage] = useState<string>('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: profile?.full_name || '',
    email: profile?.email || '',
    bio: profile?.bio || '',
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.full_name,
        email: profile.email,
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user?.id) {
      loadUserSkills();
    }
  }, [user?.id]);

  const loadUserSkills = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Loading user skills for user:', user.id);
      
      const [skills, evaluationStats] = await Promise.all([
        getUserSkills(user.id),
        getUserSkillEvaluationStats(user.id)
      ]);
      
      console.log('User skills loaded:', skills);
      console.log('Skill evaluation stats loaded:', evaluationStats);
      setUserSkills(skills);
      setSkillEvaluationStats(evaluationStats);
    } catch (error) {
      console.error('Error loading user skills:', error);
      setError('Failed to load your skills. Some features may be limited.');
      // Set empty array as fallback
      setUserSkills([]);
      setSkillEvaluationStats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    try {
      await updateProfile(user.id, {
        full_name: profileData.name,
        bio: profileData.bio,
      });
      
      // Refresh the profile context
      refreshProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    }
  };

  const handleRemoveSkillClick = (skillId: string, skillName: string) => {
    setSkillToRemove({ id: skillId, name: skillName });
    setShowRemovalModal(true);
    setRemovalMessage('');
  };

  const confirmRemoveSkill = async () => {
    if (!skillToRemove || !user?.id) return;

    setIsRemoving(true);
    setRemovalMessage('');

    try {
      const result = await removeUserSkill(user.id, skillToRemove.id);
      
      if (result.success) {
        // Remove from local state
        setUserSkills(prev => prev.filter(s => s.skill_id !== skillToRemove.id));
        setShowRemovalModal(false);
        setSkillToRemove(null);
      } else {
        setRemovalMessage(result.message);
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      setRemovalMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  const cancelRemoveSkill = () => {
    setShowRemovalModal(false);
    setSkillToRemove(null);
    setRemovalMessage('');
    setIsRemoving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 md:space-y-8 pb-20 md:pb-0">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading your profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-0">
      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Notice</h4>
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-xl p-4 md:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-start justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <div className="text-center md:text-left">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="text-2xl md:text-3xl font-bold text-slate-800 bg-transparent border-b-2 border-blue-500 focus:outline-none text-center md:text-left"
                  />
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="text-slate-600 bg-slate-100 border-b border-slate-300 text-center md:text-left cursor-not-allowed"
                    title="Email cannot be changed"
                  />
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="text-slate-600 bg-transparent border border-slate-300 rounded-lg p-2 w-full focus:outline-none focus:border-blue-500"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">{profileData.name}</h2>
                  <p className="text-slate-600 mb-2">{profileData.email}</p>
                  <p className="text-slate-600 mb-3">{profileData.bio || 'No bio added yet.'}</p>
                  <div className="flex items-center justify-center md:justify-start text-slate-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center md:justify-start space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Current Skills Progress */}
      <div className="bg-white rounded-xl p-4 md:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800">Speaking Skills</h3>
            <p className="text-slate-600">Skills you're working on improving</p>
          </div>
          <Link
            to="/onboarding?from=profile"
            className="flex items-center justify-center space-x-2 px-4 md:px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg"
          >
            <Settings className="w-4 h-4" />
            <span>Manage Skills</span>
          </Link>
        </div>

        {userSkills.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">No Skills Selected</h4>
            <p className="text-slate-600 mb-6">
              Get started by selecting the speaking skills you want to improve.
            </p>
            <Link
              to="/onboarding?from=profile"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
            >
              <Settings className="w-4 h-4" />
              <span>Select Skills</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Skills Info Banner */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Skill Protection</h4>
                  <p className="text-sm text-blue-600">
                    Skills with evaluations are protected and cannot be deleted. Skills without evaluations can be removed if needed.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {userSkills.map((userSkill) => {
                const skill = userSkill.skill;
                if (!skill) return null;

                // Get evaluation stats for this skill
                const skillStats = skillEvaluationStats.find(stat => stat.skillId === skill.id);
                const averageRating = skillStats?.averageRating || 0;
                const evaluationCount = skillStats?.evaluationCount || 0;

                return (
                  <div key={userSkill.id} className="relative group">
                    <div className="p-4 md:p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-100">
                      {/* Remove button for skills without evaluations */}
                      {!userSkill.has_evaluations && (
                        <button
                          onClick={() => handleRemoveSkillClick(userSkill.skill_id, skill.name)}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Remove skill (no evaluations yet)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Protected skill indicator */}
                      {userSkill.has_evaluations && (
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                            <Shield className="w-3 h-3" />
                            <span>Protected</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{skill.icon}</span>
                          <h4 className="font-semibold text-slate-800 text-sm md:text-base">{skill.name}</h4>
                        </div>
                        {evaluationCount > 0 && (
                          <span className="text-sm text-slate-600">{averageRating.toFixed(1)}/5</span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-600 mb-3">{skill.description}</p>
                      
                      {evaluationCount > 0 && (
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-slate-600 mb-1">
                            <span>Average Rating</span>
                            <span>{averageRating.toFixed(1)}/5</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((averageRating / 5) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {evaluationCount > 0 ? (
                            [...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 md:w-4 md:h-4 ${
                                  i < Math.floor(averageRating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">No ratings yet</span>
                          )}
                        </div>
                        
                        <div className="text-right">
                          {evaluationCount > 0 ? (
                            <div className="text-xs text-slate-600">
                              {evaluationCount} evaluation{evaluationCount !== 1 ? 's' : ''}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500">
                              No evaluations yet
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Skills Summary */}
            <div className="mt-6 md:mt-8 grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 md:p-4 text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-600 mb-1">{userSkills.length}</div>
                <div className="text-xs md:text-sm text-blue-700">Total Skills</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 md:p-4 text-center">
                <div className="text-xl md:text-2xl font-bold text-green-600 mb-1">
                  {skillEvaluationStats.length}
                </div>
                <div className="text-xs md:text-sm text-green-700">With Evaluations</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-3 md:p-4 text-center">
                <div className="text-xl md:text-2xl font-bold text-purple-600 mb-1">
                  {skillEvaluationStats.length > 0 
                    ? (skillEvaluationStats.reduce((sum, stat) => sum + stat.averageRating, 0) / skillEvaluationStats.length).toFixed(1)
                    : 0
                  }
                </div>
                <div className="text-xs md:text-sm text-purple-700">Average Level</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Skill Removal Confirmation Modal */}
      {showRemovalModal && skillToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Remove Skill</h3>
              <button
                onClick={cancelRemoveSkill}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isRemoving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-slate-600 mb-4">
                Are you sure you want to remove <strong>{skillToRemove.name}</strong> from your skills?
              </p>
              
              {removalMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{removalMessage}</p>
                  </div>
                </div>
              )}
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium mb-1">Note:</p>
                    <p>Skills that have evaluations or are associated with speeches cannot be removed to preserve your progress history.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelRemoveSkill}
                className="flex-1 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={isRemoving}
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveSkill}
                disabled={isRemoving}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Remove Skill</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;