import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FileAudio, User, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

interface Consultation {
  id: string;
  audio_url: string;
  transcript: string | null;
  email_source: string;
  created_at: string;
  consultant: {
    name: string;
    email: string;
  };
  scores: {
    category: string;
    score: number;
    notes: string;
  }[];
}

function App() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsultations();
  }, []);

  async function fetchConsultations() {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          consultant:consultants(*),
          scores(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FileAudio className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">
                Sales Consultation Analyzer
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {consultations.map((consultation) => (
              <div
                key={consultation.id}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {consultation.consultant.name}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({consultation.consultant.email})
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(consultation.created_at), 'PPp')}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <FileAudio className="h-5 w-5 text-gray-400" />
                      <a
                        href={consultation.audio_url}
                        className="ml-2 text-sm text-indigo-600 hover:text-indigo-500"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Listen to Recording
                      </a>
                    </div>

                    {consultation.transcript && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900">
                          Transcript
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">
                          {consultation.transcript}
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Scores
                      </h4>
                      <div className="grid gap-4">
                        {consultation.scores.map((score, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded"
                          >
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {score.category}
                              </span>
                              <p className="text-sm text-gray-500">
                                {score.notes}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <BarChart3 className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-sm font-semibold text-gray-900">
                                {score.score}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;