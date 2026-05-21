
from ml.ml_analyzer import predict_url

# Test safe URL
result = predict_url('https://www.google.com')
print(f'Safe URL: {result[\"status\"]} ({result[\"risk_score\"]}%)')

# Test phishing URL
result = predict_url('https://verify-account.tk')
print(f'Phishing URL: {result[\"status\"]} ({result[\"risk_score\"]}%)')
