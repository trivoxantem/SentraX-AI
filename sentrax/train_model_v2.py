"""
Machine Learning Model Training Script v2.0
==============================================

This script trains a GradientBoosting model (production-grade) using:
- 5000+ URLs with balanced labels
- 21 advanced features
- Probability-based risk scoring
- Model versioning (url_model_v2.pkl)

Usage:
    python train_model_v2.py
"""

import os
import sys
import pandas as pd
import numpy as np
from pathlib import Path
import warnings

warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report, roc_auc_score
import joblib

from ml.feature_extractor import URLFeatureExtractor, get_feature_names


class URLPhishingModelTrainerV2:
    """Train GradientBoosting model with 21 features."""
    
    def __init__(self, data_path='data/urls_v2.csv', model_path='models/url_model_v2.pkl'):
        """
        Initialize trainer.
        
        Args:
            data_path: Path to CSV with URLs and labels
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
        """Load URL dataset from CSV."""
        print("[ML-v2] Loading dataset from:", self.data_path)
        
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Dataset not found at {self.data_path}. Run: python generate_dataset.py")
        
        df = pd.read_csv(self.data_path)
        print(f"[ML-v2] Loaded {len(df)} URLs")
        print(f"[ML-v2] Label distribution:\n{df['label'].value_counts()}")
        
        return df
    
    def extract_features(self, df: pd.DataFrame) -> tuple:
        """Extract 21 features from URLs."""
        print("[ML-v2] Extracting 21 features from URLs...")
        
        X = []
        valid_labels = []
        failed_count = 0
        
        for idx, row in df.iterrows():
            try:
                url = row['url']
                label = row['label']
                
                # Extract 21 features
                extractor = URLFeatureExtractor(url)
                features = extractor.extract_all_features()
                
                X.append(features)
                valid_labels.append(label)
                
            except Exception as e:
                failed_count += 1
                continue
        
        X = np.array(X)
        y = np.array(valid_labels)
        
        print(f"[ML-v2] Extracted features for {len(X)} URLs ({failed_count} failed)")
        print(f"[ML-v2] Feature shape: {X.shape}")
        print(f"[ML-v2] Features (21): {', '.join(self.feature_names)}")
        
        return X, y
    
    def split_data(self, X, y, test_size=0.2, random_state=42):
        """Split into train (80%) and test (20%) sets."""
        print(f"[ML-v2] Splitting data: 80% train, 20% test")
        
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y,
            test_size=test_size,
            random_state=random_state,
            stratify=y
        )
        
        print(f"[ML-v2] Train set size: {len(self.X_train)}")
        print(f"[ML-v2] Test set size: {len(self.X_test)}")
    
    def train_model(self):
        """Train GradientBoosting model (production-grade)."""
        print("[ML-v2] Training GradientBoostingClassifier...")
        
        self.model = GradientBoostingClassifier(
            n_estimators=200,          # More iterations than RandomForest
            learning_rate=0.1,         # Gradual learning
            max_depth=7,               # Deeper trees for complex patterns
            min_samples_split=5,
            min_samples_leaf=2,
            subsample=0.8,             # Stochastic gradient boosting
            random_state=42,
            verbose=0
        )
        
        print("[ML-v2] Parameters:")
        print(f"       - Estimators: 200")
        print(f"       - Learning Rate: 0.1")
        print(f"       - Max Depth: 7")
        print(f"       - Subsample: 0.8")
        
        self.model.fit(self.X_train, self.y_train)
        print("[ML-v2] ✅ Model training complete!")
    
    def evaluate_model(self):
        """Evaluate on test set with comprehensive metrics."""
        print("\n" + "="*70)
        print("MODEL EVALUATION (GradientBoosting v2.0)")
        print("="*70)
        
        # Predictions
        y_pred = self.model.predict(self.X_test)
        y_pred_proba = self.model.predict_proba(self.X_test)
        
        # Get probability of positive class
        y_pred_proba_positive = y_pred_proba[:, 1]
        
        # Calculate metrics
        accuracy = accuracy_score(self.y_test, y_pred)
        precision = precision_score(self.y_test, y_pred)
        recall = recall_score(self.y_test, y_pred)
        f1 = f1_score(self.y_test, y_pred)
        auc_roc = roc_auc_score(self.y_test, y_pred_proba_positive)
        
        print(f"\n🎯 CORE METRICS:")
        print(f"   Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
        print(f"   Precision: {precision:.4f} ({precision*100:.2f}%)")
        print(f"   Recall:    {recall:.4f} ({recall*100:.2f}%)")
        print(f"   F1 Score:  {f1:.4f}")
        print(f"   AUC-ROC:   {auc_roc:.4f}")
        
        # Confusion matrix
        cm = confusion_matrix(self.y_test, y_pred)
        print(f"\n📊 CONFUSION MATRIX:")
        print(f"   True Negatives:  {cm[0,0]:4d} (correctly identified safe)")
        print(f"   False Positives: {cm[0,1]:4d} (safe marked as phishing)")
        print(f"   False Negatives: {cm[1,0]:4d} (phishing marked as safe) ⚠️")
        print(f"   True Positives:  {cm[1,1]:4d} (correctly identified phishing)")
        
        # Classification report
        print(f"\n📈 CLASSIFICATION REPORT:")
        print(classification_report(self.y_test, y_pred, target_names=['Safe (0)', 'Phishing (1)']))
        
        # Feature importance
        print(f"\n🔍 TOP 10 MOST IMPORTANT FEATURES:")
        importances = self.model.feature_importances_
        indices = np.argsort(importances)[::-1][:10]
        
        for rank, idx in enumerate(indices, 1):
            print(f"   {rank:2d}. {self.feature_names[idx]:25s} - Importance: {importances[idx]:.4f}")
        
        print("="*70 + "\n")
        
        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'auc_roc': auc_roc
        }
    
    def save_model(self):
        """Save trained model to disk."""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        print(f"[ML-v2] Saving model to: {self.model_path}")
        joblib.dump(self.model, self.model_path)
        
        # Save feature names
        feature_names_path = self.model_path.replace('.pkl', '_features.pkl')
        joblib.dump(self.feature_names, feature_names_path)
        
        print(f"[ML-v2] ✅ Model saved successfully!")
        print(f"[ML-v2]    - Model: {self.model_path}")
        print(f"[ML-v2]    - Features: {feature_names_path}")
    
    def train_full_pipeline(self):
        """Run complete training pipeline."""
        print("\n" + "="*70)
        print("SentraX URL PHISHING DETECTION - MODEL TRAINING v2.0")
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
            
            print("[ML-v2] ✅ Training pipeline complete!")
            print("[ML-v2] Model is ready for production use!\n")
            
            return True
            
        except Exception as e:
            print(f"[ML-v2] ❌ Error during training: {e}")
            import traceback
            traceback.print_exc()
            return False


# Main execution
if __name__ == '__main__':
    trainer = URLPhishingModelTrainerV2()
    success = trainer.train_full_pipeline()
    
    if success:
        print("[ML-v2] 🚀 Next steps:")
        print("[ML-v2]    1. Update ml_analyzer.py to use url_model_v2.pkl")
        print("[ML-v2]    2. Restart Django server")
        print("[ML-v2]    3. Test with: curl /api/check-url/")
    else:
        print("[ML-v2] ❌ Training failed. Please check errors above.")
        sys.exit(1)
