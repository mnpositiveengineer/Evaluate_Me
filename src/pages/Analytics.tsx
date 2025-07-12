import React from 'react';
import { TrendingUp, TrendingDown, Target, Award, Brain, Users } from 'lucide-react';

const Analytics: React.FC = () => {
  const skillProgress = [
    { name: 'Vocal Variety', current: 7.2, previous: 6.8, change: 0.4, trend: 'up' },
    { name: 'Body Language', current: 8.1, previous: 7.9, change: 0.2, trend: 'up' },
    { name: 'Content Structure', current: 6.5, previous: 6.9, change: -0.4, trend: 'down' },
    { name: 'Audience Engagement', current: 5.8, previous: 5.2, change: 0.6, trend: 'up' },
    { name: 'Confidence', current: 7.8, previous: 7.1, change: 0.7, trend: 'up' },
    { name: 'Storytelling', current: 4.9, previous: 4.3, change: 0.6, trend: 'up' },
  ];

  const monthlyProgress = [
    { month: 'Jan', score: 3.2 },
    { month: 'Feb', score: 3.8 },
    { month: 'Mar', score: 4.1 },
    { month: 'Apr', score: 4.6 },
  ];

  const aiInsights = [
    {
      type: 'strength',
      title: 'Excellent Body Language',
      description: 'Your gesture usage has improved by 40% over the last month. Keep using purposeful hand movements.',
      icon: '💪',
    },
    {
      type: 'improvement',
      title: 'Vocal Variety Opportunity',
      description: 'Try incorporating more pitch variation. Aim for 3-4 distinct tone levels per minute.',
      icon: '🎯',
    },
    {
      type: 'recommendation',
      title: 'Practice Storytelling',
      description: 'Based on peer feedback, focus on narrative structure. Try the "Problem-Solution-Benefit" framework.',
      icon: '📚',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Progress Analytics</h2>
        <p className="text-slate-600">Track your speaking development with detailed insights and AI-powered recommendations</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">4.2</span>
          </div>
          <p className="text-slate-600 font-medium mt-4">Overall Score</p>
          <p className="text-green-600 text-sm">+0.3 from last month</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">6/8</span>
          </div>
          <p className="text-slate-600 font-medium mt-4">Goals Achieved</p>
          <p className="text-blue-600 text-sm">75% completion rate</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">47</span>
          </div>
          <p className="text-slate-600 font-medium mt-4">Evaluations Given</p>
          <p className="text-green-600 text-sm">+12 this month</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">12</span>
          </div>
          <p className="text-slate-600 font-medium mt-4">Achievements</p>
          <p className="text-orange-600 text-sm">3 new badges</p>
        </div>
      </div>

      {/* Skills Progress Chart */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">Skill Development Progress</h3>
        
        <div className="space-y-6">
          {skillProgress.map((skill) => (
            <div key={skill.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-800">{skill.name}</h4>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-600">{skill.current}/10</span>
                  <div className={`flex items-center space-x-1 ${
                    skill.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {skill.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {skill.change > 0 ? '+' : ''}{skill.change}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(skill.current / 10) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Beginner</span>
                  <span>Expert</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">Monthly Progress Trend</h3>
        
        <div className="flex items-end space-x-4 h-64">
          {monthlyProgress.map((month, index) => (
            <div key={month.month} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all duration-500"
                style={{ height: `${(month.score / 5) * 100}%` }}
              ></div>
              <div className="mt-3 text-center">
                <div className="font-semibold text-slate-800">{month.score}</div>
                <div className="text-sm text-slate-600">{month.month}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-2xl font-bold text-slate-800">AI-Powered Insights</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {aiInsights.map((insight, index) => (
            <div key={index} className={`rounded-lg p-6 border-l-4 ${
              insight.type === 'strength' 
                ? 'bg-green-50 border-green-500' 
                : insight.type === 'improvement'
                ? 'bg-yellow-50 border-yellow-500'
                : 'bg-blue-50 border-blue-500'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">{insight.icon}</span>
                <h4 className="font-semibold text-slate-800">{insight.title}</h4>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;