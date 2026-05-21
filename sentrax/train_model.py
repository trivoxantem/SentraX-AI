"""
Machine Learning Model Training Script for URL Phishing Detection
==================================================================

This script:
1. Loads URL dataset
2. Extracts features
3. Trains RandomForest model
4. Evaluates performance
5. Saves model to disk

Usage:
    python manage.py shell < train_model.py
    OR from command line:
    python train_model.py
"""

import os
import sys
import pandas as pd
import numpy as np
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import joblib
import warnings

warnings.filterwarnings('ignore')

from ml.feature_extractor import URLFeatureExtractor, get_feature_names


class URLPhishingModelTrainer:
    """Train and evaluate URL phishing detection model."""
    
    def __init__(self, data_path='data/urls.csv', model_path='models/url_model.pkl'):
        """
        Initialize trainer.
        
        Args:
            data_path: Path to CSV file with URLs and labels
            model_path: Where to save the trained model
        """
        self.data_path = data_path
        self.model_path = model_path
        self.model = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.feature_names = get_feature_names()
    
    def load_data(self) -> pd.DataFrame:
        """
        Load URL dataset from CSV.
        
        Expected format:
        - url: URL string
        - label: 0 (safe) or 1 (phishing)
        
        Returns:
            pd.DataFrame: Loaded data
        """
        print("[ML] Loading dataset from:", self.data_path)
        
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Dataset not found at {self.data_path}")
        
        df = pd.read_csv(self.data_path)
        print(f"[ML] Loaded {len(df)} URLs")
        print(f"[ML] Label distribution:\n{df['label'].value_counts()}")
        
        return df
    
    def extract_features(self, df: pd.DataFrame) -> tuple:
        """
        Extract features from URLs in dataset.
        
        Args:
            df: DataFrame with 'url' column
            
        Returns:
            tuple: (X, y) - Features array and labels array
        """
        print("[ML] Extracting features from URLs...")
        
        X = []
        valid_urls = []
        valid_labels = []
        
        for idx, row in df.iterrows():
            try:
                url = row['url']
                label = row['label']
                
                # Extract features
                extractor = URLFeatureExtractor(url)
                features = extractor.extract_all_features()
                
                X.append(features)
                valid_urls.append(url)
                valid_labels.append(label)
                
            except Exception as e:
                print(f"[ML] Warning: Could not process URL {row['url']}: {e}")
                continue
        
        X = np.array(X)
        y = np.array(valid_labels)
        
        print(f"[ML] Extracted features for {len(X)} URLs")
        print(f"[ML] Feature shape: {X.shape}")
        print(f"[ML] Features: {self.feature_names}")
        
        return X, y
    
    def split_data(self, X, y, test_size=0.2, random_state=42):
        """
        Split data into train and test sets.
        
        Args:
            X: Features array
            y: Labels array
            test_size: Proportion of test set (0.2 = 20%)
            random_state: Random seed for reproducibility
        """
        print(f"[ML] Splitting data: {int((1-test_size)*100)}% train, {int(test_size*100)}% test")
        
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y,
            test_size=test_size,
            random_state=random_state,
            stratify=y  # Maintain label distribution
        )
        
        print(f"[ML] Train set size: {len(self.X_train)}")
        print(f"[ML] Test set size: {len(self.X_test)}")
    
    def train_model(self, n_estimators=100, random_state=42):
        """
        Train RandomForest classifier.
        
        Args:
            n_estimators: Number of trees in forest
            random_state: Random seed
        """
        print(f"[ML] Training RandomForestClassifier with {n_estimators} trees...")
        
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            random_state=random_state,
            n_jobs=-1,  # Use all CPU cores
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight='balanced'  # Handle class imbalance
        )
        
        self.model.fit(self.X_train, self.y_train)
        print("[ML] Model training complete!")
    
    def evaluate_model(self):
        """Evaluate model on test set and print metrics."""
        print("\n" + "="*70)
        print("MODEL EVALUATION")
        print("="*70)
        
        # Make predictions
        y_pred = self.model.predict(self.X_test)
        y_pred_proba = self.model.predict_proba(self.X_test)
        
        # Calculate metrics
        accuracy = accuracy_score(self.y_test, y_pred)
        precision = precision_score(self.y_test, y_pred)
        recall = recall_score(self.y_test, y_pred)
        f1 = f1_score(self.y_test, y_pred)
        
        print(f"\nAccuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
        print(f"Precision: {precision:.4f} ({precision*100:.2f}%)")
        print(f"Recall:    {recall:.4f} ({recall*100:.2f}%)")
        print(f"F1 Score:  {f1:.4f}")
        
        # Confusion matrix
        cm = confusion_matrix(self.y_test, y_pred)
        print(f"\nConfusion Matrix:")
        print(f"  True Negatives:  {cm[0,0]}")
        print(f"  False Positives: {cm[0,1]}")
        print(f"  False Negatives: {cm[1,0]}")
        print(f"  True Positives:  {cm[1,1]}")
        
        # Classification report
        print(f"\nClassification Report:")
        print(classification_report(self.y_test, y_pred, target_names=['Safe (0)', 'Phishing (1)']))
        
        # Feature importance
        print(f"\nFeature Importance (Top 10):")
        importances = self.model.feature_importances_
        indices = np.argsort(importances)[::-1][:10]
        
        for rank, idx in enumerate(indices, 1):
            print(f"  {rank}. {self.feature_names[idx]}: {importances[idx]:.4f}")
        
        print("="*70 + "\n")
        
        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1
        }
    
    def save_model(self):
        """Save trained model to disk."""
        # Create models directory if it doesn't exist
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        print(f"[ML] Saving model to {self.model_path}...")
        joblib.dump(self.model, self.model_path)
        print(f"[ML] Model saved successfully!")
        
        # Also save feature names
        feature_names_path = self.model_path.replace('.pkl', '_features.pkl')
        joblib.dump(self.feature_names, feature_names_path)
        print(f"[ML] Feature names saved to {feature_names_path}")
    
    def train_full_pipeline(self):
        """Run complete training pipeline."""
        print("\n" + "="*70)
        print("SentraX URL PHISHING DETECTION MODEL TRAINING")
        print("="*70 + "\n")
        
        try:
            # Load data
            df = self.load_data()
            
            # Extract features
            X, y = self.extract_features(df)
            
            # Split data
            self.split_data(X, y)
            
            # Train model
            self.train_model()
            
            # Evaluate
            metrics = self.evaluate_model()
            
            # Save model
            self.save_model()
            
            print("[ML] ✅ Training pipeline complete!")
            return True
            
        except Exception as e:
            print(f"[ML] ❌ Error during training: {e}")
            import traceback
            traceback.print_exc()
            return False


# Main execution
if __name__ == '__main__':
    trainer = URLPhishingModelTrainer()
    success = trainer.train_full_pipeline()
    
    if success:
        print("\n[ML] Model is ready for production use!")
        print("[ML] Load with: from ml.ml_analyzer import load_ml_model")
    else:
        print("\n[ML] Training failed. Please check logs above.")
        sys.exit(1)
