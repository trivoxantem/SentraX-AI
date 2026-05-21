#!/usr/bin/env python3
"""
SentraX URL Phishing Detection - Model Training v2.1
Real-World Dataset Edition (651K URLs)

Trains GradientBoostingClassifier on 651,191 real-world URLs
from malicious_phish.csv dataset.

Multi-class threats converted to binary:
- benign (0) = Safe
- phishing, defacement, malware (1) = Threat

Performance: ~96%+ accuracy expected (real-world data)
Training time: ~2-5 minutes (depends on system)
"""

import os
import sys
import pandas as pd
import numpy as np
import warnings
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
from sklearn.preprocessing import StandardScaler
import joblib

# Suppress warnings
warnings.filterwarnings('ignore')

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml.feature_extractor import URLFeatureExtractor


class URLPhishingModelTrainerV2Real:
    """Train phishing detection model on real-world dataset."""
    
    def __init__(self, dataset_path='data/malicious_phish.csv'):
        """Initialize trainer with real dataset."""
        self.dataset_path = dataset_path
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        
    def load_data(self):
        """Load and prepare real-world dataset."""
        print(f"\n[ML-v2.1] Loading real-world dataset from: {self.dataset_path}")
        
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(f"Dataset not found: {self.dataset_path}")
        
        # Load dataset
        df = pd.read_csv(self.dataset_path, dtype={'url': str, 'type': str})
        print(f"[ML-v2.1] Total URLs loaded: {len(df):,}")
        
        # Show class distribution
        print(f"\n[ML-v2.1] Original class distribution:")
        print(df['type'].value_counts())
        
        # Convert to binary classification
        # benign = 0 (safe), others = 1 (threat)
        df['label'] = (df['type'] != 'benign').astype(int)
        
        print(f"\n[ML-v2.1] Binary classification distribution:")
        print(f"  Safe URLs (0):    {(df['label'] == 0).sum():,}")
        print(f"  Threat URLs (1):  {(df['label'] == 1).sum():,}")
        print(f"  Class balance:    {(df['label'] == 0).sum() / len(df) * 100:.1f}% safe / {(df['label'] == 1).sum() / len(df) * 100:.1f}% threats")
        
        self.df = df
        return df
    
    def extract_features(self, sample_size=None):
        """Extract 21 features from URLs."""
        print(f"\n[ML-v2.1] Extracting 21 features from URLs...")
        
        urls = self.df['url'].values
        total = len(urls)
        
        if sample_size:
            print(f"[ML-v2.1] Using sample of {sample_size:,} URLs for training")
            # Stratified sample
            sample_df = self.df.sample(n=min(sample_size, total), 
                                       random_state=42,
                                       stratify=self.df['label'])
            urls = sample_df['url'].values
            labels = sample_df['label'].values
        else:
            labels = self.df['label'].values
        
        features_list = []
        failed = 0
        
        # Extract features with progress bar
        for i, url in enumerate(urls):
            if (i + 1) % 50000 == 0:
                print(f"[ML-v2.1] Progress: {i+1:,}/{len(urls):,} URLs processed...")
            try:
                extractor = URLFeatureExtractor(url)
                features = extractor.extract_all_features()
                if features and len(features) == 21:
                    features_list.append(features)
                else:
                    failed += 1
            except Exception as e:
                failed += 1
                if failed <= 5:  # Show first 5 errors only
                    print(f"  [Warning] Failed to extract features from: {url[:50]}")
        
        X = np.array(features_list)
        y = labels[:len(features_list)]
        
        print(f"[ML-v2.1] ✅ Extracted features for {len(features_list):,} URLs ({failed:,} failed)")
        print(f"[ML-v2.1] Feature shape: {X.shape}")
        print(f"[ML-v2.1] Features (21): {', '.join([
            'url_length', 'domain_length', 'dot_count', 'dash_count',
            'has_https', 'digit_count_domain', 'special_char_count',
            'subdomain_count', 'keyword_count', 'has_ip',
            'has_suspicious_tld', 'path_length', 'port_present',
            'unusual_encoding', 'at_symbol_count', 'query_param_count',
            'digit_to_letter_ratio', 'hyphen_count', 'suspicious_tld_count',
            'entropy_domain', 'long_domain_flag'
        ])}")
        
        self.feature_names = [
            'url_length', 'domain_length', 'dot_count', 'dash_count',
            'has_https', 'digit_count_domain', 'special_char_count',
            'subdomain_count', 'keyword_count', 'has_ip',
            'has_suspicious_tld', 'path_length', 'port_present',
            'unusual_encoding', 'at_symbol_count', 'query_param_count',
            'digit_to_letter_ratio', 'hyphen_count', 'suspicious_tld_count',
            'entropy_domain', 'long_domain_flag'
        ]
        
        return X, y
    
    def split_data(self, X, y, test_size=0.2):
        """Split data into train and test sets."""
        print(f"\n[ML-v2.1] Splitting data: {int((1-test_size)*100)}% train, {int(test_size*100)}% test")
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        print(f"[ML-v2.1] Train set size: {len(X_train):,}")
        print(f"[ML-v2.1] Test set size:  {len(X_test):,}")
        
        return X_train, X_test, y_train, y_test
    
    def train_model(self, X_train, y_train):
        """Train GradientBoosting classifier."""
        print(f"\n[ML-v2.1] Training GradientBoostingClassifier...")
        print(f"[ML-v2.1] Parameters:")
        print(f"         - Estimators: 200")
        print(f"         - Learning Rate: 0.1")
        print(f"         - Max Depth: 7")
        print(f"         - Subsample: 0.8")
        
        self.model = GradientBoostingClassifier(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=7,
            subsample=0.8,
            random_state=42,
            verbose=1,
            n_iter_no_change=10
        )
        
        self.model.fit(X_train, y_train)
        print(f"[ML-v2.1] ✅ Model training complete!")
        
        return self.model
    
    def evaluate_model(self, X_test, y_test):
        """Evaluate model performance."""
        print(f"\n[ML-v2.1] Evaluating model...")
        
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        auc_roc = roc_auc_score(y_test, y_pred_proba)
        
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel()
        
        # Print results
        print("\n" + "="*70)
        print("MODEL EVALUATION (GradientBoosting v2.1 - Real Data)")
        print("="*70)
        
        print(f"\n🎯 CORE METRICS:")
        print(f"   Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
        print(f"   Precision: {precision:.4f} ({precision*100:.2f}%)")
        print(f"   Recall:    {recall:.4f} ({recall*100:.2f}%)")
        print(f"   F1 Score:  {f1:.4f}")
        print(f"   AUC-ROC:   {auc_roc:.4f}")
        
        print(f"\n📊 CONFUSION MATRIX:")
        print(f"   True Negatives:  {tn:,} (correctly identified safe)")
        print(f"   False Positives: {fp:,} (safe marked as threat)")
        print(f"   False Negatives: {fn:,} (threat marked as safe)")
        print(f"   True Positives:  {tp:,} (correctly identified threat)")
        
        # Feature importance
        print(f"\n🔍 TOP 10 MOST IMPORTANT FEATURES:")
        importances = self.model.feature_importances_
        feature_importance = list(zip(self.feature_names, importances))
        feature_importance.sort(key=lambda x: x[1], reverse=True)
        
        for i, (name, importance) in enumerate(feature_importance[:10], 1):
            print(f"   {i}. {name:<25} - Importance: {importance:.4f}")
        
        # Classification report
        print(f"\n📋 CLASSIFICATION REPORT:")
        print(classification_report(y_test, y_pred, 
                                   target_names=['Safe (0)', 'Threat (1)']))
        
        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'auc_roc': auc_roc,
            'confusion_matrix': cm
        }
    
    def save_model(self, model_path='models/url_model_v2.pkl', 
                   features_path='models/url_model_v2_features.pkl'):
        """Save trained model to disk."""
        print(f"\n[ML-v2.1] ✅ Model training complete!")
        print(f"[ML-v2.1] Saving model to: {model_path}")
        
        # Create models directory if needed
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        # Save model
        joblib.dump(self.model, model_path)
        joblib.dump(self.feature_names, features_path)
        
        model_size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"[ML-v2.1] ✅ Model saved successfully!")
        print(f"[ML-v2.1]    - Model: {model_path}")
        print(f"[ML-v2.1]    - Size: {model_size_mb:.1f} MB")
        print(f"[ML-v2.1]    - Features: {features_path}")
    
    def train_full_pipeline(self, sample_size=None):
        """Run complete training pipeline."""
        print("\n" + "="*70)
        print("SentraX URL PHISHING DETECTION - MODEL TRAINING v2.1 (Real Data)")
        print("="*70)
        
        # Load data
        self.load_data()
        
        # Extract features
        X, y = self.extract_features(sample_size=sample_size)
        
        # Split data
        X_train, X_test, y_train, y_test = self.split_data(X, y)
        
        # Train model
        self.train_model(X_train, y_train)
        
        # Evaluate model
        self.evaluate_model(X_test, y_test)
        
        # Save model
        self.save_model()
        
        print(f"\n[ML-v2.1] ✅ Training pipeline complete!")
        print(f"[ML-v2.1] Model is ready for production use!")
        print(f"\n🚀 Next steps:")
        print(f"   1. Restart Django server")
        print(f"   2. Test with: curl /api/check-url/")
        
        return self.model


if __name__ == "__main__":
    # Initialize trainer
    trainer = URLPhishingModelTrainerV2Real(dataset_path='data/malicious_phish.csv')
    
    # You can optionally limit to a sample for faster training
    # For full dataset: sample_size=None (default)
    # For testing: sample_size=50000
    
    print(f"\n{'='*70}")
    print(f"Using FULL 651K real-world dataset for training")
    print(f"This may take 3-10 minutes depending on your system")
    print(f"{'='*70}\n")
    
    # Train full pipeline
    model = trainer.train_full_pipeline(sample_size=None)  # None = use all 651K URLs
