import React, { useState } from 'react';
import { Users, Star, Award, Clock, MessageSquare, ThumbsUp, Filter, Search } from 'lucide-react';

const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState('evaluate');

  const pendingEvaluations = [
    {
      id: 1,
      speaker: 'Jennifer Liu',
      title: 'Overcoming Stage Fright',
      duration: '7:30',
      skills: ['Confidence', 'Body Language'],
      uploadDate: '2024-04-12',
      reward: 50,
    },
    {
      id: 2,
      speaker: 'Michael Rodriguez',
      title: 'Data Visualization Best Practices',
      duration: '12:45',
      skills: ['Presentation', 'Content Structure'],
      uploadDate: '2024-04-11',
      reward: 75,
    },
    {
      id: 3,
      speaker: 'Emma Thompson',
      title: 'Leadership Communication',
      duration: '9:20',
      skills: ['Leadership', 'Persuasion'],
      uploadDate: '2024-04-10',
      reward: 60,
    },
  ];

  const leaderboard = [
    { rank: 1, name: 'Sarah Wilson', points: 2150, evaluations: 89, avatar: '👩‍💼' },
    { rank: 2, name: 'Alex Johnson', points: 1890, evaluations: 67, avatar: '👨‍💻' },
    { rank: 3, name: 'Maria Garcia', points: 1750, evaluations: 72, avatar: '👩‍🎨' },
    { rank: 4, name: 'David Chen', points: 1680, evaluations: 58, avatar: '👨‍🔬' },
    { rank: 5, name: 'Lisa Park', points: 1520, evaluations: 53, avatar: '👩‍🏫' },
  ];

  const mentors = [
    {
      name: 'Dr. Amanda Foster',
      specialty: 'Executive Communication',
      experience: '15+ years',
      rating: 4.9,
      students: 45,
      avatar: '👩‍🏫',
    },
    {
      name: 'Robert Kim',
      specialty: 'Technical Presentations',
      experience: '12+ years',
      rating: 4.8,
      students: 38,
      avatar: '👨‍💼',
    },
    {
      name: 'Rachel Martinez',
      specialty: 'Storytelling & Narrative',
      experience: '10+ years',
      rating: 4.9,
      students: 52,
      avatar: '👩‍🎭',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Community Hub</h2>
        <p className="text-slate-600">Connect with peers, evaluate speeches, and learn from mentors</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl p-2 shadow-sm border border-slate-200">
        <div className="flex space-x-2">
          {[
            { id: 'evaluate', label: 'Evaluate Peers', icon: MessageSquare },
            { id: 'leaderboard', label: 'Leaderboard', icon: Award },
            { id: 'mentors', label: 'Find Mentors', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'evaluate' && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search speeches to evaluate..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Pending Evaluations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingEvaluations.map((evaluation) => (
              <div key={evaluation.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">{evaluation.title}</h3>
                    <p className="text-slate-600 text-sm">by {evaluation.speaker}</p>
                  </div>
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                    +{evaluation.reward} pts
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {evaluation.duration}
                    </span>
                    <span>{new Date(evaluation.uploadDate).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {evaluation.skills.map((skill) => (
                      <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg py-2 font-medium hover:from-blue-600 hover:to-blue-700 transition-all">
                  Start Evaluation
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-xl font-bold text-slate-800">Top Contributors</h3>
            <p className="text-slate-600">Rankings based on evaluation quality and community engagement</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {leaderboard.map((user) => (
                <div key={user.rank} className={`flex items-center space-x-4 p-4 rounded-lg ${
                  user.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-slate-50'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    user.rank === 1 ? 'bg-yellow-400 text-white' :
                    user.rank === 2 ? 'bg-gray-400 text-white' :
                    user.rank === 3 ? 'bg-orange-400 text-white' :
                    'bg-slate-300 text-slate-700'
                  }`}>
                    {user.rank <= 3 ? '🏆' : user.rank}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{user.name}</h4>
                    <p className="text-sm text-slate-600">{user.evaluations} evaluations given</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-slate-800">{user.points}</div>
                    <div className="text-sm text-slate-600">points</div>
                  </div>
                  
                  <div className="text-2xl">{user.avatar}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mentors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <div key={mentor.name} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                  {mentor.avatar}
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">{mentor.name}</h3>
                <p className="text-slate-600 text-sm mb-2">{mentor.specialty}</p>
                <p className="text-slate-500 text-xs">{mentor.experience}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-semibold text-slate-800">{mentor.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Students</span>
                  <span className="font-semibold text-slate-800">{mentor.students}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg py-2 font-medium hover:from-purple-600 hover:to-purple-700 transition-all">
                  Connect
                </button>
                <button className="w-full text-slate-600 border border-slate-200 rounded-lg py-2 font-medium hover:bg-slate-50 transition-colors">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;