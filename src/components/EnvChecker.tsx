import React from 'react';
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

const EnvChecker: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const checks = [
    {
      name: 'VITE_SUPABASE_URL',
      value: supabaseUrl,
      isValid: !!(supabaseUrl && supabaseUrl.includes('supabase.co')),
      expected: 'https://your-project.supabase.co'
    },
    {
      name: 'VITE_SUPABASE_ANON_KEY',
      value: supabaseAnonKey,
      isValid: !!(supabaseAnonKey && supabaseAnonKey.length > 100),
      expected: 'Long string starting with eyJ...'
    }
  ];

  const allValid = checks.every(check => check.isValid);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
        <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
        Environment Configuration Check
      </h2>
      
      <div className="space-y-4">
        {checks.map((check) => (
          <div key={check.name} className="flex items-start space-x-3">
            {check.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-medium text-slate-800">{check.name}</div>
              <div className="text-sm text-slate-600">
                {check.isValid ? (
                  <span className="text-green-600">✓ Configured correctly</span>
                ) : (
                  <span className="text-red-600">
                    ✗ Missing or invalid (expected: {check.expected})
                  </span>
                )}
              </div>
              {check.value && (
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  {check.value.substring(0, 50)}...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!allValid && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">How to fix:</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
            <li>Select your project</li>
            <li>Go to Settings → API</li>
            <li>Copy the Project URL and anon public key</li>
            <li>Add them to your .env file as shown above</li>
          </ol>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2 flex items-center">
          <ExternalLink className="w-4 h-4 mr-1" />
          Quick Links:
        </h3>
        <div className="space-y-1 text-sm">
          <a 
            href="https://supabase.com/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block text-blue-600 hover:text-blue-700 underline"
          >
            → Supabase Dashboard
          </a>
          <a 
            href="https://supabase.com/docs/guides/getting-started/quickstarts/reactjs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block text-blue-600 hover:text-blue-700 underline"
          >
            → React Setup Guide
          </a>
        </div>
      </div>
    </div>
  );
};

export default EnvChecker;