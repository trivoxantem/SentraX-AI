from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, ActivityLog, BlockRule, Family, Alert, Device


# =========================
# USER SERIALIZER
# =========================
class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model.
    Returns basic user information: id, username, email, role, family
    """
    family = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'family']
        read_only_fields = ['id']

    def get_family(self, obj):
        """Return family ID if user belongs to a family"""
        return obj.family.id if obj.family else None


# =========================
# DEVICE SERIALIZER
# =========================
class DeviceSerializer(serializers.ModelSerializer):
    """
    Serializer for Device model.
    Returns device information: id, name, device_type, status, last_active, created_at
    """
    class Meta:
        model = Device
        fields = ['id', 'name', 'device_type', 'status', 'last_active', 'created_at']
        read_only_fields = ['id', 'last_active', 'created_at']


# =========================
# REGISTER SERIALIZER
# =========================
class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Handles user creation with proper password hashing and validation.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'role']

    def validate_email(self, value):
        """Validate that email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        """Validate that username is unique."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, data):
        """Validate that passwords match."""
        if data.get('password') != data.get('password2'):
            raise serializers.ValidationError(
                {"password": "Passwords must match."}
            )
        return data

    def create(self, validated_data):
        """Create user with hashed password."""
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'parent'),
        )
        return user


# =========================
# LOGIN SERIALIZER
# =========================
class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    Authenticates user using username and password.
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        """Authenticate user and return validated data."""
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            raise serializers.ValidationError(
                "Username and password are required."
            )

        user = authenticate(username=username, password=password)

        if not user:
            raise serializers.ValidationError(
                "Invalid username or password."
            )

        data['user'] = user
        return data


# =========================
# ACTIVITY LOG SERIALIZER
# =========================
class ActivitySerializer(serializers.ModelSerializer):
    """
    Serializer for ActivityLog model.
    Returns activity log data: id, url, status, risk_score, reason, timestamp
    """
    class Meta:
        model = ActivityLog
        fields = ['id', 'url', 'status', 'risk_score', 'reason', 'timestamp']
        read_only_fields = ['id', 'timestamp']


# =========================
# ALERT SERIALIZER
# =========================
class AlertSerializer(serializers.ModelSerializer):
    """
    Serializer for Alert model.
    Returns alert data: id, child_username, url, message, is_read, created_at
    """
    child_username = serializers.CharField(source='child.username', read_only=True)
    
    class Meta:
        model = Alert
        fields = ['id', 'child_username', 'url', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at', 'child_username', 'url', 'message']


# =========================
# BLOCK RULE SERIALIZER
# =========================
class BlockRuleSerializer(serializers.ModelSerializer):
    """
    Serializer for BlockRule model.
    Handles creating and displaying block rules for users.
    """
    class Meta:
        model = BlockRule
        fields = ['id', 'domain', 'keyword', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate(self, data):
        """Validate that at least domain or keyword is provided."""
        domain = data.get('domain')
        keyword = data.get('keyword')
        
        if not domain and not keyword:
            raise serializers.ValidationError("Either domain or keyword must be provided.")
        
        return data


# =========================
# FAMILY SERIALIZER
# =========================
class FamilySerializer(serializers.ModelSerializer):
    """
    Serializer for Family model.
    Handles family data with member information.
    """
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    
    class Meta:
        model = Family
        fields = ['id', 'name', 'owner', 'owner_username', 'created_at']
        read_only_fields = ['id', 'owner', 'created_at']


# =========================
# FAMILY MEMBER SERIALIZER
# =========================
class FamilyMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for User model (family members).
    Returns user info with role.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']
        read_only_fields = ['id', 'username', 'email', 'role']


# =========================
# ADD CHILD SERIALIZER
# =========================
class AddChildSerializer(serializers.Serializer):
    """
    Serializer for adding a new child user to family.
    """
    username = serializers.CharField(max_length=150, required=True)
    password = serializers.CharField(write_only=True, min_length=8, required=True)
    
    def validate_username(self, value):
        """Check that username is unique."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def create(self, validated_data):
        """Create a new child user."""
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            role='child'
        )
        return user


# =========================
# SETTINGS SERIALIZER
# =========================
class SettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for user settings.
    Returns user profile data: username, email, role, profile_image, notifications_enabled, created_at
    Allows updating: username, email, profile_image
    """
    profile_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'profile_image', 'profile_image_url', 'notifications_enabled', 'created_at', 'updated_at']
        read_only_fields = ['id', 'role', 'created_at', 'updated_at']
    
    def get_profile_image_url(self, obj):
        """Return full URL for profile image if it exists."""
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None


# =========================
# PASSWORD CHANGE SERIALIZER
# =========================
class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for changing user password.
    Validates old password and ensures new passwords match.
    """
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, required=True, min_length=8)
    
    def validate_old_password(self, value):
        """Validate that old password is correct."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value
    
    def validate(self, data):
        """Validate that new passwords match."""
        if data.get('new_password') != data.get('new_password_confirm'):
            raise serializers.ValidationError(
                {"new_password": "New passwords must match."}
            )
        return data
    
    def save(self):
        """Save the new password for the user."""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


# =========================
# PRIVACY SETTINGS SERIALIZER
# =========================
class PrivacySettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for privacy settings.
    Allows updating notification preferences.
    """
    class Meta:
        model = User
        fields = ['notifications_enabled']

