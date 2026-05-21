from django.db import models
from django.contrib.auth.models import AbstractUser


# =========================
# 👤 USER MODEL
# =========================
class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('parent', 'Parent'),
        ('child', 'Child'),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='parent')
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    family = models.ForeignKey('Family', on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    notifications_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username


# =========================
# 💻 DEVICE MODEL
# =========================
class Device(models.Model):
    STATUS_CHOICES = (
        ('secure', 'Secure'),
        ('risk', 'At Risk'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    name = models.CharField(max_length=100)
    device_type = models.CharField(max_length=50)  # e.g. Browser, Mobile
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='secure')
    last_active = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"


# =========================
# 🌐 ACTIVITY LOG
# =========================
class ActivityLog(models.Model):
    STATUS_CHOICES = (
        ('safe', 'Safe'),
        ('suspicious', 'Suspicious'),
        ('dangerous', 'Dangerous'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    device = models.ForeignKey(Device, on_delete=models.CASCADE, null=True, blank=True)
    url = models.URLField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    risk_score = models.IntegerField(default=0)
    reason = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Activity: {self.url} - {self.status}"


# =========================
# ⚠️ ALERT MODEL
# =========================
class Alert(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alerts')
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='parent_alerts')  # Parent
    child = models.ForeignKey(User, on_delete=models.CASCADE, related_name='child_alerts')  # Child
    url = models.URLField()
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Alert for {self.user.username}: {self.message}"


# =========================
# ⚠️ THREAT MODEL
# =========================
class Threat(models.Model):
    THREAT_TYPES = (
        ('phishing', 'Phishing'),
        ('malware', 'Malware'),
        ('adult', 'Adult Content'),
    )
    
    threat_type = models.CharField(max_length=20, choices=THREAT_TYPES)
    risk_score = models.IntegerField()  # 0–100
    description = models.TextField(blank=True, null=True)
    detected_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.threat_type} - Risk: {self.risk_score}"


# =========================
# 🛡️ PROTECTION RULES
# =========================
class BlockRule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='block_rules')
    domain = models.CharField(max_length=255, blank=True, null=True)
    keyword = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.domain or self.keyword


# =========================
# 📊 USER ANALYTICS
# =========================
class UserStats(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='stats')
    threats_blocked = models.IntegerField(default=0)
    safe_sites = models.IntegerField(default=0)
    dangerous_sites = models.IntegerField(default=0)
    safety_score = models.IntegerField(default=100)

    def __str__(self):
        return f"{self.user.username} Stats"
    


# =========================
# 👨‍👩‍👧 FAMILY MODEL
# =========================
class Family(models.Model):
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_families')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name