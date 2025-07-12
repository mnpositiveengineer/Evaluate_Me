/*
  # Insert Initial Data for SpeakElevate

  1. Skills Data
    - Insert comprehensive list of speaking skills
    - Organized by categories and difficulty levels

  2. Achievements Data
    - Insert initial achievement badges
    - Various categories for motivation and gamification
*/

-- Insert comprehensive skills data
INSERT INTO skills (name, description, category, difficulty, icon) VALUES
-- Core Speaking Skills
('Vocal Variety', 'Master tone, pace, volume, and pitch variation', 'Core Speaking', 'Beginner', '🎵'),
('Body Language', 'Use gestures, posture, and movement effectively', 'Core Speaking', 'Beginner', '🤲'),
('Eye Contact', 'Connect with audience through purposeful eye contact', 'Core Speaking', 'Beginner', '👁️'),
('Voice Projection', 'Speak clearly and audibly to all audience members', 'Core Speaking', 'Beginner', '📢'),
('Articulation', 'Pronounce words clearly and distinctly', 'Core Speaking', 'Beginner', '🗣️'),
('Breathing Techniques', 'Control breath for better voice and reduced anxiety', 'Core Speaking', 'Beginner', '🫁'),

-- Content & Structure
('Content Structure', 'Organize ideas with clear intro, body, and conclusion', 'Content & Structure', 'Intermediate', '📋'),
('Storytelling', 'Craft compelling narratives that resonate', 'Content & Structure', 'Advanced', '📚'),
('Opening Techniques', 'Create powerful speech openings that grab attention', 'Content & Structure', 'Intermediate', '🚀'),
('Closing Techniques', 'End speeches with memorable and impactful conclusions', 'Content & Structure', 'Intermediate', '🎯'),
('Smooth Transitions', 'Connect ideas seamlessly throughout your speech', 'Content & Structure', 'Intermediate', '🔗'),
('Message Clarity', 'Communicate your main points clearly and concisely', 'Content & Structure', 'Beginner', '💡'),

-- Audience Connection
('Audience Engagement', 'Connect and interact effectively with your audience', 'Audience Connection', 'Intermediate', '👥'),
('Audience Analysis', 'Understand and adapt to your audience''s needs', 'Audience Connection', 'Advanced', '🔍'),
('Interactive Techniques', 'Use questions, polls, and activities to engage', 'Audience Connection', 'Intermediate', '🙋'),
('Appropriate Humor', 'Use humor effectively and appropriately', 'Audience Connection', 'Advanced', '😄'),
('Emotional Connection', 'Create emotional resonance with your audience', 'Audience Connection', 'Advanced', '❤️'),

-- Confidence & Mindset
('Confidence Building', 'Overcome nervousness and project self-assurance', 'Confidence & Mindset', 'Beginner', '💪'),
('Anxiety Management', 'Control nerves and speaking anxiety', 'Confidence & Mindset', 'Beginner', '🧘'),
('Stage Presence', 'Command attention and own the speaking space', 'Confidence & Mindset', 'Intermediate', '⭐'),
('Authentic Speaking', 'Be genuine and true to yourself while speaking', 'Confidence & Mindset', 'Intermediate', '🎭'),
('Speaking Resilience', 'Recover gracefully from mistakes and interruptions', 'Confidence & Mindset', 'Advanced', '🛡️'),

-- Persuasion & Influence
('Persuasive Speaking', 'Influence and convince through logical arguments', 'Persuasion & Influence', 'Advanced', '🎯'),
('Logical Reasoning', 'Build compelling arguments with sound logic', 'Persuasion & Influence', 'Advanced', '🧠'),
('Emotional Appeals', 'Use emotions ethically to strengthen your message', 'Persuasion & Influence', 'Advanced', '💝'),
('Credibility Building', 'Establish trust and authority with your audience', 'Persuasion & Influence', 'Intermediate', '🏆'),
('Call to Action', 'Motivate audience to take specific actions', 'Persuasion & Influence', 'Intermediate', '📣'),

-- Leadership
('Leadership Communication', 'Communicate vision and inspire teams effectively', 'Leadership', 'Advanced', '👑'),
('Vision Casting', 'Articulate and share compelling organizational vision', 'Leadership', 'Advanced', '🔮'),
('Team Motivation', 'Inspire and energize team members through speaking', 'Leadership', 'Advanced', '🚀'),
('Difficult Conversations', 'Navigate challenging discussions with confidence', 'Leadership', 'Advanced', '⚖️'),
('Feedback Delivery', 'Give constructive feedback effectively', 'Leadership', 'Intermediate', '📝'),
('Change Communication', 'Communicate organizational changes effectively', 'Leadership', 'Advanced', '🔄'),

-- Professional Speaking
('Business Presentations', 'Deliver professional presentations with impact', 'Professional Speaking', 'Intermediate', '📊'),
('Technical Communication', 'Explain complex concepts to diverse audiences', 'Professional Speaking', 'Intermediate', '🔬'),
('Sales Presentations', 'Present products and services persuasively', 'Professional Speaking', 'Advanced', '💼'),
('Meeting Facilitation', 'Lead and manage effective meetings', 'Professional Speaking', 'Intermediate', '🤝'),
('Client Communication', 'Communicate effectively with clients and stakeholders', 'Professional Speaking', 'Intermediate', '🤵'),

-- Adaptability
('Impromptu Speaking', 'Think quickly and speak confidently without preparation', 'Adaptability', 'Advanced', '⚡'),
('Q&A Handling', 'Manage questions and answers confidently', 'Adaptability', 'Intermediate', '❓'),
('Virtual Speaking', 'Excel at online presentations and video calls', 'Adaptability', 'Intermediate', '💻'),
('Cross-Cultural Communication', 'Adapt communication style for diverse cultures', 'Adaptability', 'Advanced', '🌍'),
('Crisis Communication', 'Communicate effectively during challenging times', 'Adaptability', 'Advanced', '🚨'),

-- Advanced Techniques
('Emotional Intelligence', 'Read the room and adapt communication style', 'Advanced Techniques', 'Advanced', '🎭'),
('Nonverbal Mastery', 'Master all aspects of nonverbal communication', 'Advanced Techniques', 'Advanced', '🎪'),
('Advanced Storytelling', 'Master complex narrative techniques and structures', 'Advanced Techniques', 'Advanced', '📖'),
('Rhetorical Devices', 'Use advanced rhetorical techniques effectively', 'Advanced Techniques', 'Advanced', '🎨'),
('Debate Skills', 'Argue points effectively in competitive settings', 'Advanced Techniques', 'Advanced', '⚔️');

-- Insert initial achievements
INSERT INTO achievements (name, description, icon, category, points) VALUES
-- First Steps
('First Speech', 'Upload your first speech for practice', '🎤', 'milestones', 10),
('First Evaluation', 'Receive your first evaluation from a peer', '⭐', 'milestones', 15),
('Self Reflection', 'Complete your first self-evaluation', '🪞', 'milestones', 10),
('Skill Explorer', 'Select your first set of skills to practice', '🎯', 'milestones', 5),

-- Consistency
('Weekly Warrior', 'Practice speaking for 7 consecutive days', '🔥', 'consistency', 25),
('Monthly Master', 'Practice speaking for 30 consecutive days', '📅', 'consistency', 100),
('Evaluation Enthusiast', 'Provide 10 evaluations to other speakers', '💬', 'community', 50),
('Feedback Champion', 'Provide 50 evaluations to other speakers', '🏆', 'community', 200),

-- Skill Development
('Confidence Builder', 'Achieve level 5 in Confidence Building', '💪', 'skills', 30),
('Storytelling Star', 'Achieve level 5 in Storytelling', '📚', 'skills', 40),
('Presentation Pro', 'Achieve level 5 in Business Presentations', '📊', 'skills', 35),
('Voice Virtuoso', 'Achieve level 5 in Vocal Variety', '🎵', 'skills', 30),

-- Community
('Helpful Helper', 'Receive 25 "helpful" votes on your evaluations', '🤝', 'community', 75),
('Mentor Material', 'Receive 100 "helpful" votes on your evaluations', '👨‍🏫', 'community', 250),
('Community Champion', 'Help 100 speakers improve their skills', '🌟', 'community', 300),

-- Progress
('Rising Star', 'Improve 3 skills by 2 levels each', '🌠', 'progress', 60),
('Skill Master', 'Reach level 8 in any skill', '🎓', 'progress', 100),
('Speaking Sage', 'Reach level 10 in any skill', '🧙‍♂️', 'progress', 200),
('Well Rounded', 'Practice skills from 5 different categories', '🎪', 'progress', 80),

-- Special
('Early Adopter', 'Join SpeakElevate in its first month', '🚀', 'special', 50),
('Beta Tester', 'Provide feedback during beta testing', '🧪', 'special', 25),
('Perfectionist', 'Receive a perfect 5.0 average score', '💎', 'special', 150);