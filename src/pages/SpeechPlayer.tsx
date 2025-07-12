import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MessageSquare, ThumbsUp, User, Send, ArrowLeft, X, Mic, MicOff, Plus, Brain, Share2, Copy, Check, QrCode, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { getUserSpeeches, getSpeechSkills, getSpeechEvaluations, createEvaluation, createEvaluationSkillScores, generateSpeechShareToken, Speech, SpeechSkill, Evaluation, supabase } from '../lib/supabase';
import QRCode from 'qrcode';

interface EvaluationForm {
  skillScores: Record<string, number>;
  whatWentWell: string;
  whatCouldBeImproved: string;
  evaluatorName: string;
}

const SpeechPlayer: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [speech, setSpeech] = useState<Speech | null>(null);
  const [speechSkills, setSpeechSkills] = useState<SpeechSkill[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [showWrittenEvaluationForm, setShowWrittenEvaluationForm] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evaluationSkillScores, setEvaluationSkillScores] = useState<Record<string, any[]>>({});
  
  // Evaluation form state
  const [evaluation, setEvaluation] = useState<EvaluationForm>({
    skillScores: {},
    whatWentWell: '',
    whatCouldBeImproved: '',
    evaluatorName: ''
  });

  // Written evaluation form state
  const [writtenEvaluation, setWrittenEvaluation] = useState({
    evaluatorName: '',
    writtenFeedback: ''
  });

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
      
      // Load user's speeches to find the current one
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
      
      setSpeech(currentSpeech);
      
      // Load speech skills and evaluations
      const [skills, speechEvaluations] = await Promise.all([
        getSpeechSkills(id),
        getSpeechEvaluations(id)
      ]);
      
      setSpeechSkills(skills);
      setEvaluations(speechEvaluations);
      
      // Load skill scores for each evaluation
      const skillScores: Record<string, any[]> = {};
      for (const evaluation of speechEvaluations) {
        try {
          const { data: scores } = await supabase
            .from('evaluation_skill_scores')
            .select(`
              *,
              skill:skills(*)
            `)
            .eq('evaluation_id', evaluation.id);
          
          if (scores) {
            skillScores[evaluation.id] = scores;
          }
        } catch (error) {
          console.error('Error loading skill scores for evaluation:', evaluation.id, error);
          skillScores[evaluation.id] = [];
        }
      }
      setEvaluationSkillScores(skillScores);
      
    } catch (error) {
      console.error('Error loading speech data:', error);
      setError('Failed to load speech data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate AI Summary based on evaluations
  const generateAISummary = () => {
    if (evaluations.length === 0) {
      return {
        overallScore: 0,
        strengths: ['No evaluations available for analysis'],
        improvements: ['Share your speech to receive evaluations first'],
        recommendations: ['Get feedback from multiple evaluators for comprehensive insights'],
        practiceAreas: [],
        practiceTips: ['Record yourself practicing to identify areas for improvement'],
        nextSteps: ['Share your speech link with colleagues, friends, or mentors']
      };
    }

    // Analyze evaluations to extract insights
    const allPositiveFeedback = evaluations.map(e => e.what_went_well).filter(f => f).join(' ').toLowerCase();
    const allImprovementFeedback = evaluations.map(e => e.what_could_be_improved).filter(f => f).join(' ').toLowerCase();
    
    // Calculate average skill scores
    const skillAverages: Record<string, number[]> = {};
    Object.values(evaluationSkillScores).forEach(scores => {
      scores.forEach(score => {
        if (!skillAverages[score.skill_id]) {
          skillAverages[score.skill_id] = [];
        }
        skillAverages[score.skill_id].push(score.score);
      });
    });
    
    const avgSkillScores = Object.entries(skillAverages).map(([skillId, scores]) => ({
      skillId,
      average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      skillName: speechSkills.find(ss => ss.skill_id === skillId)?.skill?.name || 'Unknown'
    }));
    
    const overallAverage = avgSkillScores.length > 0 
      ? avgSkillScores.reduce((sum, skill) => sum + skill.average, 0) / avgSkillScores.length 
      : 0;
    
    // Identify strengths (skills with high scores)
    const strengths = avgSkillScores
      .filter(skill => skill.average >= 4)
      .map(skill => `Strong ${skill.skillName.toLowerCase()} (${skill.average.toFixed(1)}/5)`)
      .slice(0, 4);
    
    if (strengths.length === 0 && allPositiveFeedback) {
      strengths.push('Positive feedback received from evaluators');
    }
    
    // Identify areas for improvement (skills with lower scores)
    const improvements = avgSkillScores
      .filter(skill => skill.average < 3.5)
      .map(skill => `Improve ${skill.skillName.toLowerCase()} (${skill.average.toFixed(1)}/5)`)
      .slice(0, 4);
    
    if (improvements.length === 0 && allImprovementFeedback) {
      improvements.push('Focus on areas mentioned in evaluator feedback');
    }
    
    // Generate practice areas based on lowest scoring skills
    const practiceAreas = avgSkillScores
      .sort((a, b) => a.average - b.average)
      .slice(0, 3)
      .map(skill => skill.skillName);
    
    // Generate specific practice tips based on skill areas
    const practiceTips = practiceAreas.map(skill => {
      const skillLower = skill.toLowerCase();
      if (skillLower.includes('vocal') || skillLower.includes('voice')) {
        return 'Practice vocal exercises: vary your pace, volume, and tone daily';
      } else if (skillLower.includes('body') || skillLower.includes('gesture')) {
        return 'Record yourself speaking to observe and improve your body language';
      } else if (skillLower.includes('confidence')) {
        return 'Practice in front of a mirror and gradually increase audience size';
      } else if (skillLower.includes('structure') || skillLower.includes('content')) {
        return 'Outline your speeches with clear introduction, body, and conclusion';
      } else if (skillLower.includes('audience') || skillLower.includes('engagement')) {
        return 'Practice asking questions and making eye contact with different audience members';
      } else {
        return `Focus on ${skill.toLowerCase()} through targeted practice sessions`;
      }
    });
    
    // Generate recommendations based on evaluation feedback
    const recommendations = [];
    if (allImprovementFeedback.includes('pace') || allImprovementFeedback.includes('speed')) {
      recommendations.push('Work on speaking pace - practice with a metronome or timer');
    }
    if (allImprovementFeedback.includes('eye contact') || allPositiveFeedback.includes('eye contact')) {
      recommendations.push('Continue developing eye contact skills across the entire audience');
    }
    if (allImprovementFeedback.includes('gesture') || allImprovementFeedback.includes('hand')) {
      recommendations.push('Practice purposeful gestures that support your message');
    }
    if (allImprovementFeedback.includes('structure') || allImprovementFeedback.includes('organization')) {
      recommendations.push('Focus on clear speech structure with smooth transitions');
    }
    
    // Default recommendations if none specific found
    if (recommendations.length === 0) {
      recommendations.push('Continue practicing regularly to build consistency');
      recommendations.push('Seek feedback from diverse audiences for well-rounded improvement');
    }
    
    return {
      overallScore: overallAverage,
      strengths: strengths.length > 0 ? strengths : ['Consistent delivery across evaluations'],
      improvements: improvements.length > 0 ? improvements : ['Continue refining your speaking skills'],
      recommendations,
      practiceAreas,
      practiceTips: practiceTips.length > 0 ? practiceTips : ['Practice regularly and seek diverse feedback'],
      nextSteps: [
        `Focus on improving ${practiceAreas[0] || 'your weakest skills'}`,
        'Get feedback from at least 3 more evaluators',
        'Record yourself practicing to track progress',
        'Set specific goals for your next speech'
      ]
    };
  };

  const aiSummary = generateAISummary();
  
  // Calculate average rating for a skill across all evaluations
  const getAverageSkillRating = (skillId: string): number => {
    const allScores: number[] = [];
    
    Object.values(evaluationSkillScores).forEach(scores => {
      const skillScore = scores.find(score => score.skill_id === skillId);
      if (skillScore) {
        allScores.push(skillScore.score);
      }
    });
    
    if (allScores.length === 0) return 0;
    return allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
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

  const handleSkillScore = (skill: string, score: number) => {
    setEvaluation(prev => ({
      ...prev,
      skillScores: {
        ...prev.skillScores,
        [skill]: score
      }
    }));
  };

  const handleSubmitEvaluation = async () => {
    if (!speech || !user?.id) return;
    
    // Validate required fields
    if (!evaluation.evaluatorName.trim() || (!evaluation.whatWentWell.trim() && !evaluation.whatCouldBeImproved.trim())) {
      alert('Please fill in your name and provide some feedback');
      return;
    }

    // Check if all skills have been scored
    const unscored = speechSkills.filter(speechSkill => !evaluation.skillScores[speechSkill.skill_id]);
    if (unscored.length > 0) {
      alert(`Please score all skills`);
      return;
    }

    setSubmitting(true);

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

      // Reload evaluations to show the new one
      await loadSpeechData();
      
      setShowEvaluationForm(false);
      
      // Reset form
      setEvaluation({
        skillScores: {},
        whatWentWell: '',
        whatCouldBeImproved: '',
        evaluatorName: ''
      });
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('Error submitting evaluation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitWrittenEvaluation = async () => {
    if (!speech || !user?.id) return;
    
    // Validate required fields
    if (!evaluation.evaluatorName.trim()) {
      alert('Please enter the evaluator\'s name');
      return;
    }

    // Validate that all skills have been scored
    const unscored = speechSkills.filter(speechSkill => !evaluation.skillScores[speechSkill.skill_id]);
    if (unscored.length > 0) {
      alert('Please rate all skills');
      return;
    }

    setSubmitting(true);

    try {
      // Create the evaluation with written feedback
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

      // Reload evaluations to show the new one
      await loadSpeechData();
      
      setShowWrittenEvaluationForm(false);
      
      // Reset form
      setEvaluation({
        skillScores: {},
        whatWentWell: '',
        whatCouldBeImproved: '',
        evaluatorName: ''
      });
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('Error submitting evaluation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Start recording simulation
      console.log('Starting voice recording...');
      // In a real app, you would start actual voice recording here
    } else {
      // Stop recording and simulate transcription
      console.log('Stopping voice recording...');
      // Simulate adding transcribed text
      const simulatedTranscription = " [Voice recording transcribed] The speaker did well with their opening and maintained good eye contact throughout the presentation.";
      setWrittenEvaluation(prev => ({
        ...prev,
        writtenFeedback: prev.writtenFeedback + simulatedTranscription
      }));
    }
  };

  const generateQRCode = async () => {
    if (!speech) return;
    
    try {
      let shareToken = speech.share_token;
      
      // Generate share token if it doesn't exist
      if (!shareToken) {
        shareToken = await generateSpeechShareToken(speech.id);
        setSpeech(prev => prev ? { ...prev, share_token: shareToken, is_public: true } : null);
      }
      
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
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleShowShare = () => {
    setShowShareModal(true);
    generateQRCode();
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

  const shareViaEmail = () => {
    if (!speech?.share_token) return;
    
    const evaluationUrl = `${window.location.origin}/evaluate/${speech.share_token}`;
    const subject = encodeURIComponent(`Please evaluate my speech: ${speech.title}`);
    const body = encodeURIComponent(
      `Hi!\n\nI'd love to get your feedback on my recent speech "${speech.title}".\n\nYou can evaluate it here: ${evaluationUrl}\n\nIt only takes a few minutes and your feedback will help me improve my speaking skills.\n\nThanks!\n`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
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
          <p className="text-slate-600 mb-6">{error || 'The speech you\'re trying to view could not be found.'}</p>
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

  const evaluationUrl = speech.share_token ? `${window.location.origin}/evaluate/${speech.share_token}` : '';

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/speeches')}
          className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Evaluations</h2>
          <p className="text-slate-600">View and manage your speech evaluations</p>
        </div>
      </div>

      {/* Speech Header */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">{speech.title}</h2>
        {speech.description && (
          <p className="text-slate-600 mb-6">{speech.description}</p>
        )}
        
        {/* Skills Associated with Speech */}
        {speechSkills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Skills being practiced:</h3>
            <div className="space-y-3">
              {speechSkills.map((speechSkill) => (
                <div key={speechSkill.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{speechSkill.skill?.icon}</span>
                    <span className="font-medium text-blue-800">{speechSkill.skill?.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {getAverageSkillRating(speechSkill.skill_id).toFixed(1)}
                    </div>
                    <div className="text-xs text-blue-600">Average Rating</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Speech Status */}
        <div className="flex items-center space-x-4 mb-6">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(speech.status)}`}>
            {getStatusLabel(speech.status)}
          </span>
          <span className="text-slate-600">
            {evaluations.length} Evaluation{evaluations.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Evaluations from Others */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">Evaluations from Others</h3>
        
        {evaluations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">No Evaluations Yet</h4>
            <p className="text-slate-600 mb-6">
              Share your speech to get feedback from others and track your progress.
            </p>
            <button
              onClick={handleShowShare}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
            >
              <Share2 className="w-4 h-4" />
              <span>Share for Feedback</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="border border-slate-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{evaluation.evaluator_name}</h4>
                      <p className="text-sm text-slate-600">{new Date(evaluation.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Skill Scores */}
                {evaluationSkillScores[evaluation.id] && evaluationSkillScores[evaluation.id].length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h6 className="font-medium text-slate-800 mb-3">Skill Ratings:</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {evaluationSkillScores[evaluation.id].map((skillScore) => (
                        <div key={skillScore.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <div className="flex items-center space-x-2">
                            <span>{skillScore.skill?.icon}</span>
                            <span className="text-sm font-medium text-slate-700">{skillScore.skill?.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= skillScore.score
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                            <span className="text-sm font-bold text-slate-700 ml-1">({skillScore.score})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Feedback Sections */}
                <div className="space-y-4">
                  {evaluation.what_went_well && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h5 className="font-medium text-green-800 mb-2">What went well:</h5>
                      <p className="text-green-700">{evaluation.what_went_well}</p>
                    </div>
                  )}
                  
                  {evaluation.what_could_be_improved && (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <h5 className="font-medium text-yellow-800 mb-2">What could be improved:</h5>
                      <p className="text-yellow-700">{evaluation.what_could_be_improved}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evaluate Yourself and Add Written Evaluation */}
      <div className="grid grid-cols-1 gap-6">
        {/* Add Written Evaluation */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-3">Add Written Evaluation</h3>
          <p className="text-slate-600 mb-6">
            Enter feedback you received on paper, verbally, or from other sources.
          </p>
          <button
            onClick={() => setShowWrittenEvaluationForm(true)}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add Written Evaluation</span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={handleShowShare}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>Share for Feedback</span>
          </button>
          <button 
            onClick={() => setShowAISummary(true)}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Brain className="w-5 h-5" />
            <span>AI Evaluation Summary</span>
          </button>
        </div>
      </div>

      {/* AI Summary Modal */}
      {showAISummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">AI Evaluation Summary</h3>
              </div>
              <button
                onClick={() => setShowAISummary(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Overall Score */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{aiSummary.overallScore.toFixed(1)}</div>
                  <div className="text-slate-600">Overall Performance Score</div>
                  <div className="flex justify-center mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 ${
                          star <= Math.round(aiSummary.overallScore)
                            ? 'text-yellow-400 fill-current'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Strengths */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm mr-3">✓</span>
                  Key Strengths
                </h4>
                <ul className="space-y-2">
                  {aiSummary.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start space-x-2 text-green-700">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                <h4 className="text-lg font-bold text-yellow-800 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm mr-3">!</span>
                  Areas for Improvement
                </h4>
                <ul className="space-y-2">
                  {aiSummary.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start space-x-2 text-yellow-700">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Practice Areas */}
              {aiSummary.practiceAreas && aiSummary.practiceAreas.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                  <h4 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm mr-3">🎯</span>
                    Focus Practice Areas
                  </h4>
                  <ul className="space-y-2">
                    {aiSummary.practiceAreas.map((area, index) => (
                      <li key={index} className="flex items-start space-x-2 text-purple-700">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Practice Tips */}
              {aiSummary.practiceTips && aiSummary.practiceTips.length > 0 && (
                <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
                  <h4 className="text-lg font-bold text-indigo-800 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm mr-3">💡</span>
                    Practice Tips
                  </h4>
                  <ul className="space-y-2">
                    {aiSummary.practiceTips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-2 text-indigo-700">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm mr-3">📋</span>
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {aiSummary.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2 text-blue-700">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center text-white text-sm mr-3">→</span>
                  Next Steps
                </h4>
                <ul className="space-y-2">
                  {aiSummary.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start space-x-2 text-slate-700">
                      <span className="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => setShowAISummary(false)}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
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
              {speech.share_token && (
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
              {speech.share_token && (
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/evaluate/${speech.share_token}`)}
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

      {/* Evaluation Form Modal */}
      {showEvaluationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Evaluate This Speech</h3>
              <button
                onClick={() => setShowEvaluationForm(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
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
                  onChange={(e) => setEvaluation(prev => ({ ...prev, evaluatorName: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* Skill Ratings */}
              {speechSkills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-4">Rate Each Skill (1-5)</h4>
                  <div className="space-y-4">
                    {speechSkills.map((speechSkill) => {
                      const skill = speechSkill.skill;
                      if (!skill) return null;
                      
                      return (
                        <div key={speechSkill.id} className="flex items-center justify-between">
                          <span className="text-slate-700">{skill.name}</span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                onClick={() => handleSkillScore(skill.id, rating)}
                                className={`w-8 h-8 rounded-full transition-all ${
                                  (evaluation.skillScores[skill.id] || 0) >= rating
                                    ? 'text-yellow-400 hover:text-yellow-500'
                                    : 'text-slate-300 hover:text-yellow-300'
                                }`}
                              >
                                <Star className="w-6 h-6 fill-current" />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Written Feedback */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What went well?
                </label>
                <textarea
                  value={evaluation.whatWentWell}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, whatWentWell: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What did the speaker do well? What was effective or engaging?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What could be improved?
                </label>
                <textarea
                  value={evaluation.whatCouldBeImproved}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, whatCouldBeImproved: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What areas could use some development? Be constructive and specific."
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={() => setShowEvaluationForm(false)}
                className="flex-1 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitEvaluation}
                disabled={submitting}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
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
            </div>
          </div>
        </div>
      )}

      {/* Written Evaluation Form Modal */}
      {showWrittenEvaluationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Evaluate This Speech</h3>
              <button
                onClick={() => setShowWrittenEvaluationForm(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
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
                  onChange={(e) => setEvaluation(prev => ({ ...prev, evaluatorName: e.target.value }))}
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What went well? <span className="text-slate-400">(Optional)</span>
                </label>
                <textarea
                  value={evaluation.whatWentWell}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, whatWentWell: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
                  placeholder="What did the speaker do well? What was effective or engaging?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What could be improved? <span className="text-slate-400">(Optional)</span>
                </label>
                <textarea
                  value={evaluation.whatCouldBeImproved}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, whatCouldBeImproved: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
                  placeholder="What areas could use some development? Be constructive and specific."
                />
              </div>
            </div>

            <div className="flex flex-col items-center pt-6 border-t border-slate-200 mt-8">
              <button
                onClick={handleSubmitWrittenEvaluation}
                disabled={submitting || !evaluation.evaluatorName.trim() || speechSkills.some(ss => !evaluation.skillScores[ss.skill_id])}
                className="w-full flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-base font-medium mb-4"
              >
                {submitting ? (
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
              
              <button
                onClick={() => setShowWrittenEvaluationForm(false)}
                className="px-6 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              
              <p className="text-sm text-slate-500 mt-3 text-center">
                Your feedback will help the speaker improve their skills.<br />
                Thank you for taking the time to provide constructive feedback!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechPlayer;