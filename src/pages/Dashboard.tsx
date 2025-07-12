import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Target, Award, Clock, Users, Mic } from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Speeches Delivered', value: '24', icon: Mic, color: 'blue' },
    { label: 'Skills Improved', value: '8', icon: TrendingUp, color: 'green' },
    { label: 'Peer Evaluations', value: '47', icon: Users, color: 'purple' },
    { label: 'Achievements', value: '12', icon: Award, color: 'orange' },
  ];

  const recentSpeeches = [
    { id: 1, title: 'Project Presentation Skills', date: '2 days ago', score: 4.2 },
    { id: 2, title: 'Persuasive Speaking Techniques', date: '5 days ago', score: 3.8 },
    { id: 3, title: 'Body Language Mastery', date: '1 week ago', score: 4.5 },
  ];

  const upcomingGoals = [
    'Improve vocal variety by 15%',
    'Master storytelling techniques',
    'Enhance audience engagement',
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome back, Alex!</h2>
        <p className="text-blue-100 text-lg">
          You've improved your speaking confidence by 32% this month. Keep up the great work!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'from-blue-500 to-blue-600',
            green: 'from-green-500 to-green-600',
            purple: 'from-purple-500 to-purple-600',
            orange: 'from-orange-500 to-orange-600',
          };

          return (
            <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[stat.color]} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
              </div>
              <p className="text-slate-600 font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Speeches */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800">Recent Speeches</h3>
            <Link to="/speeches" className="text-blue-600 hover:text-blue-700 font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentSpeeches.map((speech) => (
              <Link
                key={speech.id}
                to={`/speech/${speech.id}`}
                className="block p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">{speech.title}</h4>
                    <p className="text-slate-500 text-sm flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {speech.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{speech.score}</div>
                    <div className="text-xs text-slate-500">Avg Score</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Goals & Targets */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800">Current Goals</h3>
            <Link to="/profile" className="text-blue-600 hover:text-blue-700 font-medium">
              Manage
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingGoals.map((goal, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span className="text-slate-700">{goal}</span>
              </div>
            ))}
          </div>
          
          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="font-semibold text-slate-800 mb-4">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/speeches"
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3 text-center font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                Upload Speech
              </Link>
              <Link
                to="/community"
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-3 text-center font-medium hover:from-purple-600 hover:to-purple-700 transition-all"
              >
                Evaluate Peer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;