import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path
import os

MODEL_DIR = Path(__file__).parent / 'models'
MODEL_DIR.mkdir(exist_ok=True)

class CognitiveAnalyzer:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_path = MODEL_DIR / 'cognitive_model.pkl'
        self.scaler_path = MODEL_DIR / 'scaler.pkl'
        
        if self.model_path.exists():
            self.load_model()
        else:
            self.create_and_train_model()
    
    def create_and_train_model(self):
        """
        Create and train a Random Forest model for cognitive analysis.
        Uses synthetic training data based on common patterns.
        """
        # Synthetic training data: [avg_accuracy, avg_response_time, mistakes_rate, completion_time_norm]
        # Labels: 0=Low attention, 1=Medium attention, 2=High attention
        X_train = np.array([
            # High attention (label 2)
            [95, 1.2, 0.05, 0.8],
            [90, 1.5, 0.10, 0.85],
            [88, 1.3, 0.12, 0.82],
            [92, 1.1, 0.08, 0.79],
            [94, 1.4, 0.06, 0.81],
            # Medium attention (label 1)
            [75, 2.5, 0.25, 1.2],
            [70, 2.8, 0.30, 1.3],
            [68, 2.6, 0.32, 1.25],
            [72, 2.7, 0.28, 1.22],
            [74, 2.4, 0.26, 1.18],
            # Low attention (label 0)
            [45, 4.5, 0.55, 2.0],
            [40, 5.0, 0.60, 2.2],
            [38, 4.8, 0.62, 2.1],
            [42, 4.6, 0.58, 2.15],
            [44, 4.7, 0.56, 2.05],
        ])
        
        y_train = np.array([2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0])
        
        self.scaler.fit(X_train)
        X_train_scaled = self.scaler.transform(X_train)
        
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.model.fit(X_train_scaled, y_train)
        
        self.save_model()
    
    def save_model(self):
        """Save the trained model and scaler."""
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
    
    def load_model(self):
        """Load the pre-trained model and scaler."""
        self.model = joblib.load(self.model_path)
        self.scaler = joblib.load(self.scaler_path)
    
    def analyze_performance(self, game_sessions):
        """
        Analyze game performance and predict cognitive metrics.
        
        Args:
            game_sessions: List of game session dictionaries
        
        Returns:
            dict: Analysis results with attention level, learning style, etc.
        """
        if len(game_sessions) < 3:
            return None
        
        # Calculate aggregate metrics
        avg_accuracy = np.mean([s['accuracy'] for s in game_sessions])
        avg_response_time = np.mean([s['response_time'] for s in game_sessions])
        avg_mistakes = np.mean([s['mistakes'] for s in game_sessions])
        total_games = len(game_sessions)
        mistakes_rate = avg_mistakes / max(total_games, 1)
        
        # Normalize completion time (assuming average 60 seconds per game)
        avg_completion_time = np.mean([s['completion_time'] for s in game_sessions])
        completion_time_norm = avg_completion_time / 60.0
        
        # Prepare features
        features = np.array([[
            avg_accuracy,
            avg_response_time,
            mistakes_rate,
            completion_time_norm
        ]])
        
        features_scaled = self.scaler.transform(features)
        
        # Predict attention level
        attention_prediction = self.model.predict(features_scaled)[0]
        attention_proba = self.model.predict_proba(features_scaled)[0]
        
        attention_labels = ['Low', 'Medium', 'High']
        attention_level = attention_labels[attention_prediction]
        
        # Determine learning style based on response time and game preferences
        learning_style = 'Visual' if avg_response_time < 2.5 else 'Kinesthetic' if avg_response_time < 4 else 'Auditory'
        
        # Determine reading difficulty
        reading_sessions = [s for s in game_sessions if s['game_type'] == 'reading']
        if reading_sessions:
            reading_accuracy = np.mean([s['accuracy'] for s in reading_sessions])
            reading_difficulty = 'Low' if reading_accuracy > 75 else 'Medium' if reading_accuracy > 50 else 'High'
        else:
            reading_difficulty = 'Unknown'
        
        # Identify strengths and weaknesses
        game_types = {}
        for session in game_sessions:
            game_type = session['game_type']
            if game_type not in game_types:
                game_types[game_type] = []
            game_types[game_type].append(session['accuracy'])
        
        strengths = []
        weaknesses = []
        
        for game_type, accuracies in game_types.items():
            avg = np.mean(accuracies)
            game_name = game_type.replace('_', ' ').title()
            if avg > 75:
                strengths.append(game_name)
            elif avg < 50:
                weaknesses.append(game_name)
        
        # Generate recommendations
        recommendations = []
        if attention_level == 'Low':
            recommendations.append('Practice focus exercises with shorter time intervals')
            recommendations.append('Take regular breaks between learning sessions')
        if attention_level == 'High':
            recommendations.append('Challenge yourself with more complex problems')
        
        if 'Reading' in weaknesses:
            recommendations.append('Use text-to-speech features for better comprehension')
            recommendations.append('Practice reading in short, focused sessions')
        
        if learning_style == 'Visual':
            recommendations.append('Use visual aids, diagrams, and mind maps for learning')
        elif learning_style == 'Kinesthetic':
            recommendations.append('Use hands-on activities and physical movement while learning')
        elif learning_style == 'Auditory':
            recommendations.append('Use audio recordings and verbal explanations')
        
        if avg_accuracy < 60:
            recommendations.append('Focus on fundamental concepts before advancing')
        
        return {
            'attention_level': attention_level,
            'attention_confidence': float(np.max(attention_proba)),
            'learning_style': learning_style,
            'reading_difficulty': reading_difficulty,
            'strengths': strengths,
            'weaknesses': weaknesses,
            'recommendations': recommendations,
            'metrics': {
                'avg_accuracy': float(avg_accuracy),
                'avg_response_time': float(avg_response_time),
                'avg_mistakes': float(avg_mistakes)
            }
        }

# Initialize global analyzer
analyzer = CognitiveAnalyzer()