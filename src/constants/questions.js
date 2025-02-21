const MENTAL_HEALTH_QUESTIONS = {
  emotional_state: {
    id: 1,
    question: "How would you rate your emotional well-being over the past week?",
    description: "Consider your overall mood, emotional stability, and ability to cope with daily stress",
    scale: {
      1: "Struggling significantly",
      2: "Having difficulty",
      3: "Neutral",
      4: "Generally good",
      5: "Excellent"
    }
  },
  sleep_quality: {
    id: 2,
    question: "How has your sleep quality been in the past week?",
    description: "Consider factors like falling asleep, staying asleep, and feeling rested",
    scale: {
      1: "Very poor sleep",
      2: "Poor sleep",
      3: "Moderate sleep",
      4: "Good sleep",
      5: "Excellent sleep"
    }
  },
  social_connection: {
    id: 3,
    question: "How connected do you feel to others in your life?",
    description: "Consider your relationships with family, friends, and overall sense of belonging",
    scale: {
      1: "Very isolated",
      2: "Somewhat isolated",
      3: "Neutral",
      4: "Well connected",
      5: "Strongly connected"
    }
  },
  daily_functioning: {
    id: 4,
    question: "How well are you managing your daily responsibilities?",
    description: "Consider work, education, household tasks, and personal care",
    scale: {
      1: "Unable to manage",
      2: "Struggling to manage",
      3: "Managing somewhat",
      4: "Managing well",
      5: "Managing excellently"
    }
  },
  future_outlook: {
    id: 5,
    question: "How do you feel about your future?",
    description: "Consider your hopes, plans, and general outlook on what's ahead",
    scale: {
      1: "Very negative",
      2: "Somewhat negative",
      3: "Neutral",
      4: "Somewhat positive",
      5: "Very positive"
    }
  }
};

module.exports = { MENTAL_HEALTH_QUESTIONS };