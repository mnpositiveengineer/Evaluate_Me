import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Users, MessageSquare, Share2, QrCode, Copy, Check, X, Loader2, AlertCircle, Brain } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { getUserSpeeches, getSpeechSkills, getSpeechEvaluations, generateSpeechShareToken, Speech, SpeechSkill, Evaluation } from '../lib/supabase';
import QRCode from 'qrcode';

interface SpeechWithDetails extends Speech {
  skills: SpeechSkill[];
  evaluations: Evaluation[];
}

const SpeechPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [speech, setSpeech] = useState<SpeechWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [showAiSummary, setShowAiSummary] = useState(false);

  useEffect(() => {
    if (id && user?.id) {
      loadSpeechData();
    }
  }, [id, user?.id]);

  const loadSpeechData = async () => {
    if (!id || !user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load user speeches and find the current one
      const userSpeeches = await getUserSpeeches(user.id);
      const currentSpeech = userSpeeches.find(s => s.id === id);
      
      if (!currentSpeech) {
        setError('Speech not found');
        return;
      }
      
      if (currentSpeech.user_id !== user.id) {
        setError('You do not have permission to view this speech');
        return;
      }
      
      // Load speech skills and evaluations
      const [skills, evaluations] = await Promise.all([
        getSpeechSkills(id),
        getSpeechEvaluations(id)
      ]);
      
      setSpeech({
        ...currentSpeech,
        skills,
        evaluations
      });
      
    } catch (error) {
      console.error('Error loading speech data:', error);
      setError('Failed to load speech data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareClick = async () => {
    if (!speech) return;
    
    try {
      let shareToken = speech.share_token;
      
      // Generate share token if it doesn't exist
      if (!shareToken) {
        shareToken = await generateSpeechShareToken(speech.id);
        setSpeech(prev => prev ? { ...prev, share_token: shareToken, is_public: true } : null);
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

  const handleAiSummary = async () => {
    if (!speech || speech.evaluations.length === 0) return;
    
    setAiSummaryLoading(true);
    setShowAiSummary(true);
    
    try {
      // Prepare evaluation data for AI analysis
      const evaluationData = speech.evaluations.map(eval => ({
        evaluator: eval.evaluator_name,
        whatWentWell: eval.what_went_well,
        whatCouldBeImproved: eval.what_could_be_improved,
        date: new Date(eval.created_at).toLocaleDateString()
      }));
      
      const prompt = `Act as a public speaking, leadership and communication coach and based on all the evaluations for this speech suggest: Summary of what went well and what could be better, Suggested action points and recommendations, Tips on how to practice on my weaknesses.

Speech Title: ${speech.title}
${speech.description ? `Speech Description: ${speech.description}` : ''}

Evaluations:
${evaluationData.map((eval, index) => `
Evaluation ${index + 1} (by ${eval.evaluator} on ${eval.date}):
What went well: ${eval.whatWentWell || 'No feedback provided'}
What could be improved: ${eval.whatCouldBeImproved || 'No feedback provided'}
`).join('\n')}

Please provide a comprehensive analysis with actionable insights.`;

      // Simulate AI response (replace with actual AI service call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAiResponse = `## Summary of Performance

### What Went Well
Based on the evaluations, you demonstrated strong foundational speaking skills. Evaluators consistently noted your clear articulation and confident delivery. Your content structure was well-organized, making it easy for the audience to follow your main points.

### Areas for Improvement
The feedback suggests focusing on vocal variety and audience engagement. Several evaluators mentioned that varying your pace and tone could enhance the overall impact of your presentation.

## Action Points & Recommendations

1. **Practice Vocal Variety**: Record yourself speaking and experiment with different paces, volumes, and tones
2. **Enhance Audience Connection**: Work on making more eye contact and using inclusive language
3. **Strengthen Opening**: Develop a more compelling hook to capture attention from the start

## Practice Tips for Weaknesses

### For Vocal Variety:
- Read aloud daily, emphasizing different emotions
- Practice with a metronome to vary your speaking pace
- Record and analyze your speech patterns

### For Audience Engagement:
- Practice speaking to different imaginary audiences
- Use the "conversation method" - speak as if talking to a friend
- Incorporate rhetorical questions to involve your audience mentally

Continue building on your strengths while addressing these areas, and you'll see significant improvement in your speaking effectiveness.`;
      
      setAiSummary(mockAiResponse);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setAiSummary('Sorry, there was an error generating the AI summary. Please try again later.');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading speech data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !speech) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Speech Not Found</h3>
          <p className="text-slate-600 mb-6">{error || 'The speech you\'re looking for could not be found.'}</p>
          <button
            onClick={() => navigate('/speeches')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Speeches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/speeches')}
            className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-slate-800">{speech.title}</h2>
            <p className="text-slate-600">Speech evaluations and feedback</p>
          </div>
        </div>
        
        {/* AI Evaluation Summary Button */}
        <button
          onClick={handleAiSummary}
          disabled={speech.evaluations.length === 0 || aiSummaryLoading}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {aiSummaryLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              <span>AI Evaluation Summary</span>
            </>
          )}
        </button>
      </div>

      {/* AI Summary Modal */}
      {showAiSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">AI Evaluation Summary</h3>
              </div>
              <button
                onClick={() => setShowAiSummary(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="prose prose-slate max-w-none">
              {aiSummaryLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                  <p className="text-slate-600">Analyzing your evaluations...</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {aiSummary}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={() => setShowAiSummary(false)}
                className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Speech Details */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Speech Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600">Created {formatDate(speech.created_at)}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600">{speech.evaluations.length} evaluation{speech.evaluations.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-slate-400" />
                <span className="text-slate-600">Status: {speech.status}</span>
              </div>
            </div>
            
            {speech.description && (
              <div className="mt-6">
                <h4 className="font-semibold text-slate-800 mb-2">Description</h4>
                <p className="text-slate-600">{speech.description}</p>
              </div>
            )}
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Share for Evaluation</h3>
              <button
                onClick={handleShareClick}
                className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>Get QR Code</span>
              </button>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-3">
                Share your speech with others to get valuable feedback. They can evaluate it without creating an account.
              </p>
              {speech.share_token && (
                <div className="text-xs text-slate-500">
                  Public link available • {speech.is_public ? 'Public' : 'Private'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skills Being Practiced */}
      {speech.skills.length > 0 && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Skills Being Practiced</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {speech.skills.map((speechSkill) => {
              const skill = speechSkill.skill;
              if (!skill) return null;
              
              return (
                <div key={speechSkill.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-xl">{skill.icon}</span>
                    <h4 className="font-semibold text-slate-800">{skill.name}</h4>
                  </div>
                  <p className="text-sm text-slate-600">{skill.description}</p>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      skill.difficulty === 'Beginner' ? 'bg-green-100 text-green-600' :
                      skill.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {skill.difficulty}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evaluations */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-6">
          Evaluations ({speech.evaluations.length})
        </h3>
        
        {speech.evaluations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">No Evaluations Yet</h4>
            <p className="text-slate-600 mb-6">
              Share your speech to start receiving feedback from others.
            </p>
            <button
              onClick={handleShareClick}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
            >
              <Share2 className="w-4 h-4" />
              <span>Share for Evaluation</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {speech.evaluations.map((evaluation) => (
              <div key={evaluation.id} className="border border-slate-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {evaluation.evaluator_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{evaluation.evaluator_name}</h4>
                      <p className="text-sm text-slate-500">{formatDate(evaluation.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {evaluation.what_went_well && (
                    <div>
                      <h5 className="font-medium text-green-700 mb-2">What went well:</h5>
                      <p className="text-slate-600 bg-green-50 p-3 rounded-lg">{evaluation.what_went_well}</p>
                    </div>
                  )}
                  
                  {evaluation.what_could_be_improved && (
                    <div>
                      <h5 className="font-medium text-blue-700 mb-2">What could be improved:</h5>
                      <p className="text-slate-600 bg-blue-50 p-3 rounded-lg">{evaluation.what_could_be_improved}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && speech.share_token && (
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
                <h4 className="font-semibold text-slate-800 mb-2">{speech.title}</h4>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Evaluation Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/evaluate/${speech.share_token}`}
                    readOnly
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                  />
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/evaluate/${speech.share_token}`)}
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
              <button
                onClick={() => copyToClipboard(`${window.location.origin}/evaluate/${speech.share_token}`)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechPlayer;