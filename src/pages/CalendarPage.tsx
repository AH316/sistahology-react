import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { useJournal } from '../stores/journalStore';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  BookOpen, 
  Calendar,
  Search,
  Target,
  Flame,
  TrendingUp
} from 'lucide-react';
import Navigation from '../components/Navigation';

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    loadJournals, 
    getEntries, 
    currentJournal, 
    calculateWritingStreak
  } = useJournal();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Load journals when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      loadJournals(user.id);
    }
  }, [user?.id]); // Only depend on user.id, not the loadJournals function

  const entries = getEntries(currentJournal?.id);
  const currentStreak = calculateWritingStreak();

  // Calendar logic
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Get entries for current month
  const monthEntries = entries.filter(entry => {
    const entryDate = new Date(entry.entryDate);
    return entryDate.getFullYear() === year && entryDate.getMonth() === month;
  });

  // Create calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const hasEntryOnDate = (day: number) => {
    const dateString = new Date(year, month, day).toISOString().split('T')[0];
    return monthEntries.some(entry => entry.entryDate === dateString);
  };

  const getEntriesForDate = (day: number) => {
    const dateString = new Date(year, month, day).toISOString().split('T')[0];
    return monthEntries.filter(entry => entry.entryDate === dateString);
  };

  const isToday = (day: number) => {
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day;
  };

  const isFutureDate = (day: number) => {
    const dateToCheck = new Date(year, month, day);
    return dateToCheck > today;
  };

  const handleDayClick = (day: number) => {
    if (isFutureDate(day)) return;
    
    const dateString = new Date(year, month, day).toISOString().split('T')[0];
    setSelectedDate(selectedDate === dateString ? null : dateString);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate monthly stats
  const monthGoal = new Date().getMonth() === month && new Date().getFullYear() === year ? new Date().getDate() : daysInMonth;
  const monthProgress = (monthEntries.length / monthGoal) * 100;

  const selectedDateEntries = selectedDate ? getEntriesForDate(parseInt(selectedDate.split('-')[2])) : [];


  return (
    <div className="min-h-screen bg-gerbera-hero">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
            Calendar View 📅
          </h1>
          <p className="text-white/90 drop-shadow text-lg">
            Track your writing journey and build consistent habits
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-sistah-pink to-sistah-rose rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {monthEntries.length}
            </div>
            <p className="text-white/80 text-sm">This Month</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-sistah-rose to-sistah-purple rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className="text-orange-500 text-lg">🔥</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {currentStreak}
            </div>
            <p className="text-white/80 text-sm">Day Streak</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-sistah-purple to-sistah-pink rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {Math.round(monthProgress)}%
            </div>
            <p className="text-white/80 text-sm">Monthly Goal</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-400 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {entries.length}
            </div>
            <p className="text-white/80 text-sm">Total Entries</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="glass rounded-3xl p-6 backdrop-blur-lg border-2 border-white/40 bg-white/10 shadow-xl">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {monthNames[month]} {year}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-3 rounded-lg bg-white/10 hover:bg-white/25 transition-all duration-200 border border-white/20 hover:border-white/40"
                  >
                    <ChevronLeft className="w-5 h-5 text-white/80" />
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="p-3 rounded-lg bg-white/10 hover:bg-white/25 transition-all duration-200 border border-white/20 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth())}
                  >
                    <ChevronRight className="w-5 h-5 text-white/80" />
                  </button>
                </div>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-white/70 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="aspect-square"></div>;
                  }

                  const hasEntry = hasEntryOnDate(day);
                  const todayClass = isToday(day);
                  const futureClass = isFutureDate(day);
                  const selectedClass = selectedDate === new Date(year, month, day).toISOString().split('T')[0];

                  return (
                    <button
                      key={day}
                      onClick={() => handleDayClick(day)}
                      disabled={futureClass}
                      className={`
                        aspect-square p-2 rounded-xl text-sm font-medium transition-all duration-200 relative
                        ${futureClass 
                          ? 'text-white/40 cursor-not-allowed' 
                          : 'hover:bg-white/20 cursor-pointer'
                        }
                        ${todayClass 
                          ? 'ring-2 ring-sistah-pink text-sistah-pink font-bold' 
                          : 'text-white/90'
                        }
                        ${selectedClass 
                          ? 'bg-sistah-pink text-white' 
                          : ''
                        }
                        ${hasEntry && !selectedClass
                          ? 'bg-gradient-to-br from-sistah-light to-sistah-pink/20' 
                          : ''
                        }
                      `}
                    >
                      {day}
                      {hasEntry && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                          <div className={`w-1.5 h-1.5 rounded-full ${selectedClass ? 'bg-white' : 'bg-sistah-pink'}`}></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-sistah-pink"></div>
                  <span className="text-sm text-white/80">Has Entry</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full border-2 border-sistah-pink"></div>
                  <span className="text-sm text-white/80">Today</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-white/40"></div>
                  <span className="text-sm text-white/80">Future</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Entries */}
            {selectedDate && (
              <div className="glass rounded-3xl p-6 backdrop-blur-lg border border-white/30">
                <h3 className="text-xl font-bold text-white mb-4">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                
                {selectedDateEntries.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateEntries.map(entry => (
                      <div key={entry.id} className="p-4 bg-white/40 rounded-xl">
                        <p className="text-white/90 text-sm leading-relaxed line-clamp-4">
                          {entry.content}
                        </p>
                        <div className="mt-3 pt-3 border-t border-white/30">
                          <span className="text-xs text-white/70">
                            {entry.content.split(' ').length} words
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BookOpen className="w-8 h-8 text-white/60 mx-auto mb-3" />
                    <p className="text-white/70 text-sm mb-3">No entry for this date</p>
                    {!isFutureDate(parseInt(selectedDate.split('-')[2])) && (
                      <Link 
                        to={`/new-entry?date=${selectedDate}`}
                        className="text-sistah-pink font-medium text-sm hover:text-sistah-rose"
                      >
                        Create Entry
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="glass rounded-3xl p-6 backdrop-blur-lg border border-white/30">
              <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Link 
                  to="/new-entry" 
                  className="block p-4 bg-gradient-to-r from-sistah-pink to-sistah-rose rounded-xl text-white hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">New Entry</span>
                  </div>
                </Link>

                <Link 
                  to="/search" 
                  className="block p-4 bg-white/40 rounded-xl hover:bg-white/60 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Search className="w-5 h-5 text-white/80" />
                    <span className="font-medium text-white">Search Entries</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Monthly Progress */}
            <div className="glass rounded-3xl p-6 backdrop-blur-lg border border-white/30">
              <h3 className="text-xl font-bold text-white mb-4">Monthly Progress</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-white/80 mb-2">
                    <span>Entries Written</span>
                    <span>{monthEntries.length} / {monthGoal}</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-sistah-pink to-sistah-rose h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(monthProgress, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-center pt-4">
                  <div className="text-2xl font-bold text-white mb-1">
                    {Math.round(monthProgress)}%
                  </div>
                  <p className="text-white/80 text-sm">Complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;