import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Play, Share2, MoreVertical, Calendar, Clock, Star, Users, Loader2, AlertCircle, Mic, Edit, Trash2, QrCode, Copy, Check, X, MessageSquare } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { getUserSpeeches, getSpeechSkills, getSpeechEvaluationCount, deleteSpeech, generateSpeechShareToken, Speech, SpeechSkill, supabase } from '../lib/supabase';
import QRCode from 'qrcode';

interface SpeechSkillWithRating extends SpeechSkill {
  averageRating?: number;
  evaluationCount?: number;
}

interface SpeechWithEvaluations extends Speech {
  evaluationCount: number;
  skills: SpeechSkillWithRating[];
  averageRating?: number;
}

const SpeechManager: React.FC = () => {
  const { user } = useAuthContext();
  const [speeches, setSpeeches] = useState<SpeechWithEvaluations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [speechToDelete, setSpeechToDelete] = useState<SpeechWithEvaluations | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalSpeech, setShareModalSpeech] = useState<SpeechWithEvaluations | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadUserSpeeches();
    }
  }, [user?.id]);

  const loadUserSpeeches = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Loading user speeches for user:', user.id);
      
      const userSpeeches = await getUserSpeeches(user.id);
      console.log('User speeches loaded:', userSpeeches);

      // Load skills and evaluation counts for each speech
      const speechesWithData: SpeechWithEvaluations[] = [];
      
      for (const speech of userSpeeches) {
        try {
          const [skills, evaluationCount] = await Promise.all([
            getSpeechSkills(speech.id),
            getSpeechEvaluationCount(speech.id)
          ]);
          
          // Get skill ratings for this speech if it has evaluations
          let skillsWithRatings: SpeechSkillWithRating[] = skills;
          let speechAverageRating: number | undefined;
          
          if (evaluationCount > 0) {
            // Get evaluation skill scores for this speech
            const { data: skillScores, error: skillScoresError } = await supabase
              .from('evaluation_skill_scores')
              .select(`
                skill_id,
                score,
                evaluation:evaluations!inner(
                  speech_id
                )
              `)
              .eq('evaluation.speech_id', speech.id);

            if (!skillScoresError && skillScores) {
              // Calculate average rating for each skill
              const skillRatings = skillScores.reduce((acc, score) => {
                if (!acc[score.skill_id]) {
                  acc[score.skill_id] = { scores: [], count: 0 };
                }
                acc[score.skill_id].scores.push(score.score);
                acc[score.skill_id].count++;
                return acc;
              }, {} as Record<string, { scores: number[]; count: number }>);

              // Add ratings to skills
              skillsWithRatings = skills.map(skill => ({
                ...skill,
                averageRating: skillRatings[skill.skill_id] 
                  ? skillRatings[skill.skill_id].scores.reduce((sum, score) => sum + score, 0) / skillRatings[skill.skill_id].scores.length
                  : undefined,
                evaluationCount: skillRatings[skill.skill_id]?.count || 0
              }));

              // Calculate overall speech average rating
              const allScores = skillScores.map(score => score.score);
              if (allScores.length > 0) {
                speechAverageRating = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
              }
            }
          }
          
          speechesWithData.push({
            ...speech,
            skills: skillsWithRatings,
            evaluationCount,
            averageRating: speechAverageRating
          });
        } catch (error) {
          console.error(`Error loading data for speech ${speech.id}:`, error);
          speechesWithData.push({
            ...speech,
            skills: [],
            evaluationCount: 0
          });
        }
      }
      
      setSpeeches(speechesWithData);
      
    } catch (error) {
      console.error('Error loading user speeches:', error);
      setError('Failed to load your speeches. Some features may be limited.');
      setSpeeches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (speech: SpeechWithEvaluations) => {
    setSpeechToDelete(speech);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!speechToDelete) return;

    setDeletingId(speechToDelete.id);
    
    try {
      await deleteSpeech(speechToDelete.id);
      
      // Remove from local state
      setSpeeches(prev => prev.filter(s => s.id !== speechToDelete.id));
      
      setShowDeleteModal(false);
      setSpeechToDelete(null);
    } catch (error) {
      console.error('Error deleting speech:', error);
      setError('Failed to delete speech. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleShareClick = async (speech: SpeechWithEvaluations) => {
    setShareModalSpeech(speech);
    
    try {
      let shareToken = speech.share_token;
      
      // Generate share token if it doesn't exist
      if (!shareToken) {
        shareToken = await generateSpeechShareToken(speech.id);
        
        // Update local state
        setSpeeches(prev => prev.map(s => 
          s.id === speech.id 
            ? { ...s, share_token: shareToken, is_public: true }
            : s
        ));
      }
      
      // Generate QR code
      const evaluationUrl = `${window.location.origin}/evaluate/${shareToken}`;
      const qrCodeDataUrl = await QRCode.toDataURL(evaluationUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrCodeDataUrl);
      
      // Now show the modal after everything is ready
      setShowShareModal(true);
    } catch (error) {
      console.error('Error generating share data:', error);
      setError('Failed to generate sharing link. Please try again.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-600';
      case 'practicing': return 'bg-blue-100 text-blue-600';
      case 'delivered': return 'bg-green-100 text-green-600';
      case 'archived': return 'bg-slate-100 text-slate-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'practicing': return 'Practicing';
      case 'delivered': return 'Delivered';
      case 'archived': return 'Archived';
      default: return 'Unknown';
    }
  };

  // Separate speeches into categories
  const newSpeeches = speeches.filter(speech => speech.evaluationCount === 0);
  const evaluatedSpeeches = speeches.filter(speech => speech.evaluationCount > 0);
  
  // Calculate overall average rating from all evaluated speeches
  const overallAverageRating = evaluatedSpeeches.length > 0 
    ? evaluatedSpeeches
        .filter(speech => speech.averageRating !== undefined)
        .reduce((sum, speech) => sum + (speech.averageRating || 0), 0) / 
      evaluatedSpeeches.filter(speech => speech.averageRating !== undefined).length
    : 0;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading your speeches...</span>
          </div>
        </div>
      </div>
    );
  }

  const SpeechCard = ({ speech, showActions = true }: { speech: SpeechWithEvaluations; showActions?: boolean }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
      {/* Speech Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2">{speech.title}</h3>
          {speech.evaluationCount > 0 && (
            <div className="flex items-center space-x-3 mb-2">
              <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                {speech.evaluationCount} evaluation{speech.evaluationCount !== 1 ? 's' : ''}
              </span>
              {speech.averageRating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-slate-700">{speech.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {speech.evaluationCount === 0 && (
              <>
                <Link
                  to={`/edit-speech/${speech.id}`}
                  className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                  title="Edit speech"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDeleteClick(speech)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  title="Delete speech"
                  disabled={deletingId === speech.id}
                >
                  {deletingId === speech.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Speech Description */}
      {speech.description && (
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{speech.description}</p>
      )}

      {/* Skills Tags */}
      {speech.skills.length > 0 && (
        <div className="mb-4">
          <div className="space-y-2">
            {speech.skills.slice(0, 3).map((speechSkill) => (
              <div key={speechSkill.id} className="flex items-center justify-between">
                <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                  {speechSkill.skill?.name}
                </span>
                {speechSkill.averageRating !== undefined && (
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= Math.round(speechSkill.averageRating!)
                              ? 'text-yellow-400 fill-current'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-600">{speechSkill.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            ))}
            {speech.skills.length > 3 && (
              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full mt-1 inline-block">
                +{speech.skills.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2 mt-6">
        <Link
          to={`/speech/${speech.id}`}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>View evaluations</span>
        </Link>
        <button 
          onClick={() => handleShareClick(speech)}
          className="flex items-center justify-center px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
        >
          <QrCode className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">My Speeches</h2>
          <p className="text-slate-600">Practice and get feedback on your speaking skills</p>
        </div>
        <Link 
          to="/add"
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Speech</span>
        </Link>
      </div>

      {speeches.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mic className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Ready to start speaking?</h3>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Add your first speech to get personalized feedback and track your progress. 
            You can practice with any topic that interests you.
          </p>
          <div className="space-y-4">
            <Link 
              to="/add"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Speech</span>
            </Link>
            <p className="text-sm text-slate-500">
              Tip: Start with a 2-3 minute speech on a topic you're passionate about
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* New Speeches Section */}
          {newSpeeches.length > 0 && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-slate-800">
                  New Speeches ({newSpeeches.length})
                </h3>
                <span className="text-sm text-slate-500">
                  Ready for evaluation
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newSpeeches.map((speech) => (
                  <SpeechCard key={speech.id} speech={speech} />
                ))}
              </div>
            </div>
          )}

          {/* Evaluated Speeches Section */}
          {evaluatedSpeeches.length > 0 && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="text-xl font-bold text-slate-800">
                  Evaluated Speeches ({evaluatedSpeeches.length})
                </h3>
                <span className="text-sm text-slate-500">
                  With feedback received
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {evaluatedSpeeches.map((speech) => (
                  <SpeechCard key={speech.id} speech={speech} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      {speeches.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{speeches.length}</div>
              <div className="text-sm text-slate-600">Total Speeches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {evaluatedSpeeches.length}
              </div>
              <div className="text-sm text-slate-600">Evaluated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {speeches.reduce((sum, s) => sum + s.evaluationCount, 0)}
              </div>
              <div className="text-sm text-slate-600">Total Evaluations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {overallAverageRating > 0 ? overallAverageRating.toFixed(1) : '0.0'}
              </div>
              <div className="text-sm text-slate-600">Average Rating</div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && speechToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Delete Speech</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-slate-600 mb-4">
                Are you sure you want to delete "<strong>{speechToDelete.title}</strong>"?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  This action cannot be undone. The speech and all associated data will be permanently removed.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={deletingId === speechToDelete.id}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId === speechToDelete.id}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === speechToDelete.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && shareModalSpeech && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Share for Evaluation</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <h4 className="font-semibold text-slate-800 mb-2">{shareModalSpeech.title}</h4>
                <p className="text-sm text-slate-600">
                  Share this QR code or link for others to evaluate your speech
                </p>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="bg-slate-50 rounded-xl p-6 inline-block">
                  {qrCodeUrl && (
                    <img src={qrCodeUrl} alt="QR Code for speech evaluation" className="mx-auto" />
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  Scan this QR code to evaluate the speech
                </p>
              </div>

              {/* Share URL */}
              {shareModalSpeech.share_token && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Evaluation Link
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/evaluate/${shareModalSpeech.share_token}`}
                      readOnly
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                    />
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/evaluate/${shareModalSpeech.share_token}`)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        copySuccess
                          ? 'bg-green-100 text-green-600'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                    >
                      {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {copySuccess && (
                    <p className="text-sm text-green-600 mt-1">Link copied to clipboard!</p>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">How it works</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Share the QR code or link with people you want feedback from</li>
                  <li>• They can evaluate your speech without creating an account</li>
                  <li>• You'll receive their feedback and ratings automatically</li>
                  <li>• All feedback is anonymous unless they choose to share their name</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              {shareModalSpeech.share_token && (
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/evaluate/${shareModalSpeech.share_token}`)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechManager;