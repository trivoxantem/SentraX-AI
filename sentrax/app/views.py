from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from urllib.parse import urlparse
import logging
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, ActivitySerializer, BlockRuleSerializer, FamilySerializer, FamilyMemberSerializer, AddChildSerializer, AlertSerializer, DeviceSerializer, SettingsSerializer, PasswordChangeSerializer, PrivacySettingsSerializer
from .models import User, ActivityLog, Threat, BlockRule, Family, Alert, Device
from .utils.url_analyzer import analyze_url
from .utils.threat_intel import check_threat_intel, is_threat_intel_enabled
from ml.ml_analyzer import predict_url

# Get logger for this module
logger = logging.getLogger(__name__)


# =========================
# REGISTER VIEW
# =========================
class RegisterView(APIView):
    """
    POST /api/auth/register/
    Create a new user account.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user_data = UserSerializer(user).data
            return Response(
                {
                    'message': 'User registered successfully',
                    'user': user_data,
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =========================
# LOGIN VIEW
# =========================
class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticate user and return JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data

            return Response(
                {
                    'message': 'Login successful',
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': user_data,
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


# =========================
# LOGOUT VIEW
# =========================
class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Logout user (token invalidation handled client-side).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(
            {'message': 'Logged out successfully'},
            status=status.HTTP_200_OK
        )


# =========================
# USER PROFILE VIEW
# =========================
class UserProfileView(APIView):
    """
    GET /api/auth/user/
    Return current authenticated user profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =========================
# CHECK URL VIEW
# =========================
class CheckURLView(APIView):
    """
    POST /api/check-url/
    Scan and analyze a URL for security threats.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        url = request.data.get('url', '').strip()
        device_id = request.data.get('device_id')

        # Validate URL input
        if not url:
            return Response(
                {'error': 'URL is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure URL has protocol
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        logger.info(f"[URL CHECK] User: {request.user.username}, URL: {url}, Device: {device_id}")

        # Get device if device_id is provided
        device = None
        if device_id:
            try:
                device = Device.objects.get(id=device_id, user=request.user)
                logger.info(f"[DEVICE] Linked device: {device.name} (ID: {device.id})")
            except Device.DoesNotExist:
                logger.warning(f"[DEVICE] Device not found: {device_id}")
                device = None

        # Extract domain from URL for checking
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path

        # Initialize result
        result_status = 'safe'
        result_risk_score = 0
        threat_type = None
        blocked = False
        block_reason = None
        is_blocked_by_parent = False

        # Step 1: Check against BlockRules (user's own rules and parent's rules if child)
        # Collect all rules to check
        rules_to_check = []
        
        # Add user's own block rules
        user_block_rules = BlockRule.objects.filter(
            user=request.user,
            is_active=True
        )
        rules_to_check.extend(user_block_rules)
        
        # If user is a child, also add parent's block rules
        if request.user.role == 'child' and request.user.family:
            parent = request.user.family.owner
            parent_block_rules = BlockRule.objects.filter(
                user=parent,
                is_active=True
            )
            rules_to_check.extend(parent_block_rules)
            
            # Mark which rules are from parent
            for rule in parent_block_rules:
                rule.is_from_parent = True

        # Check all collected rules
        for rule in rules_to_check:
            is_blocked = False
            
            # Check domain rules - support subdomains
            if rule.domain:
                blocked_domain = rule.domain.lower().strip()
                current_domain = domain.lower().strip()

                # Remove www prefix for comparison
                blocked_domain_clean = blocked_domain.replace('www.', '')
                current_domain_clean = current_domain.replace('www.', '')

                # Match if:
                # 1. Exact domain match (facebook.com == facebook.com)
                # 2. Subdomain match (www.facebook.com contains facebook.com)
                # 3. Root domain match (both share same root)
                if (blocked_domain_clean == current_domain_clean or
                    current_domain_clean.endswith('.' + blocked_domain_clean) or
                    blocked_domain_clean in current_domain_clean):
                    is_blocked = True

            # Check keyword rules
            elif rule.keyword:
                keyword = rule.keyword.lower().strip()
                url_lower = url.lower()
                if keyword in url_lower:
                    is_blocked = True

            if is_blocked:
                blocked = True
                # Determine who blocked the rule
                if hasattr(rule, 'is_from_parent') and rule.is_from_parent:
                    block_reason = "Blocked by parent rule"
                    is_blocked_by_parent = True
                else:
                    block_reason = f"Blocked by {rule.domain or rule.keyword}"
                result_status = 'dangerous'
                result_risk_score = 95
                break  # Stop checking after first match

        # Step 2: Check against Threat Intelligence APIs (if enabled)
        threat_intel_result = None
        intel_source = None
        if not blocked and result_status == 'safe' and is_threat_intel_enabled():
            logger.info(f"[THREAT INTEL] Checking threat intelligence sources for: {url}")
            
            try:
                threat_intel_result = check_threat_intel(url)
                
                if threat_intel_result.get('malicious'):
                    # URL is malicious according to threat intel
                    result_status = 'dangerous'
                    result_risk_score = threat_intel_result.get('risk_score', 95)
                    intel_source = threat_intel_result.get('primary_threat', 'threat_intelligence')
                    block_reason = f"Detected by {intel_source.replace('_', ' ').title()}"
                    
                    logger.warning(f"[THREAT INTEL] Malicious URL detected: {url}")
                    logger.warning(f"[THREAT INTEL] Source: {intel_source}, Risk: {result_risk_score}")
                else:
                    logger.debug(f"[THREAT INTEL] URL is safe according to threat intel: {url}")
            
            except Exception as e:
                logger.error(f"[THREAT INTEL] Error during threat intelligence check: {str(e)}")
                # Continue without threat intel if there's an error

        # Step 3: Check against global Threat database (only if not already blocked)
        # Note: Threat model doesn't currently store URLs, so this check is skipped
        # TODO: Enhance Threat model to store URLs for better threat detection
        if not blocked and result_status == 'safe':
            # Placeholder for future threat database integration
            # threat = Threat.objects.filter(...).first()
            pass

        # Step 4: ML-based URL Analysis (with fallback to rule-based if ML unavailable)
        # Only run if Threat Intel didn't already run (whether it found threats or not)
        ai_analysis = None
        if not blocked and threat_intel_result is None and threat_type is None:
            logger.info(f"[ML ANALYSIS] Running ML analysis for: {url}")
            
            try:
                # Try ML model first
                ml_result = predict_url(url)
                
                # Update result from ML analysis
                result_status = ml_result['status']
                result_risk_score = ml_result['risk_score']
                
                # Log ML prediction details
                if ml_result.get('model_used'):
                    logger.info(f"[ML ANALYSIS RESULT] Model-based - Status: {result_status}, Risk Score: {result_risk_score}, Confidence: {ml_result.get('confidence', 0):.2%}")
                else:
                    logger.info(f"[ML ANALYSIS RESULT] Fallback rule-based - Status: {result_status}, Risk Score: {result_risk_score}")
                
                # Prepare analysis response with both model and feature info
                ai_analysis = {
                    'status': result_status,
                    'risk_score': result_risk_score,
                    'model_used': ml_result.get('model_used', False),
                    'confidence': ml_result.get('confidence', 0),
                    'phishing_probability': ml_result.get('phishing_probability', 0),
                    'features': ml_result.get('features', {}),
                    'fallback_reason': ml_result.get('fallback_reason')
                }
                
            except Exception as e:
                logger.error(f"[ML ANALYSIS ERROR] {e}, falling back to rule-based analyzer")
                
                # Fallback to rule-based analyzer
                ai_analysis = analyze_url(url)
                result_status = ai_analysis['status']
                result_risk_score = ai_analysis['risk_score']
                ai_analysis['model_used'] = False
                ai_analysis['fallback_reason'] = 'ML error'
                
                logger.info(f"[FALLBACK ANALYSIS RESULT] Status: {result_status}, Risk Score: {result_risk_score}")
        elif threat_intel_result is not None:
            # Threat Intel was used, log that we're skipping ML analysis
            threat_intel_status = "Malicious" if threat_intel_result.get('malicious') else "Safe"
            logger.info(f"[ANALYSIS PRIORITY] Threat Intelligence result prioritized over ML - Status: {threat_intel_status}, Risk: {result_risk_score}%")

        # Save to ActivityLog
        activity_reason = None
        if blocked:
            activity_reason = "Blocked by parent" if is_blocked_by_parent else "User blocked"
        
        activity_log = ActivityLog.objects.create(
            user=request.user,
            device=device,
            url=url,
            status=result_status,
            risk_score=result_risk_score,
            reason=activity_reason
        )

        logger.info(f"[ACTIVITY LOG] Created: {activity_log.id} | Device: {device.id if device else 'None'} | Status: {result_status}")

        # Update device status if dangerous activity detected
        if device and result_status == 'dangerous':
            device.status = 'risk'
            device.save()
            logger.warning(f"[DEVICE STATUS] Updated device {device.id} to 'at risk' due to dangerous activity")

        # Trigger alerts for child users accessing blocked content
        if request.user.role == 'child' and request.user.family:
            parent = request.user.family.owner
            
            # Alert for parent-blocked URLs
            if is_blocked_by_parent:
                Alert.objects.create(
                    user=parent,
                    parent=parent,
                    child=request.user,
                    url=url,
                    message=f"🚫 Your child attempted to access a blocked website: {url}"
                )
            # Alert for other dangerous sites
            elif result_status == 'dangerous' and not blocked:
                Alert.objects.create(
                    user=parent,
                    parent=parent,
                    child=request.user,
                    url=url,
                    message=f"⚠️ Dangerous: {url} (Risk: {result_risk_score}%)"
                )

        return Response(
            {
                'url': url,
                'domain': domain,
                'status': result_status,
                'risk_score': result_risk_score,
                'threat_type': threat_type,
                'blocked': blocked,
                'reason': block_reason or ('Blocked by your rules' if blocked else 'Not blocked'),
                'message': self._get_status_message(result_status, result_risk_score, is_blocked_by_parent),
                'is_blocked_by_parent': is_blocked_by_parent,
                'threat_intel_source': intel_source,
                'threat_intel_details': threat_intel_result if threat_intel_result and threat_intel_result.get('malicious') else None,
                'ai_analysis': ai_analysis if ai_analysis else None,
            },
            status=status.HTTP_200_OK
        )

    @staticmethod
    def _get_status_message(status_value, risk_score, is_blocked_by_parent=False):
        """Generate human-readable status message."""
        if status_value == 'safe':
            return f'✅ Safe to visit (Risk: {risk_score}%)'
        elif status_value == 'suspicious':
            return f'⚠️ Suspicious - Proceed with caution (Risk: {risk_score}%)'
        else:  # dangerous
            if is_blocked_by_parent:
                return f'🚫 This website has been blocked by your parent or administrator'
            return f'🚨 Dangerous - Blocked for your safety (Risk: {risk_score}%)'


# =========================
# ACTIVITY LOG LIST VIEW
# =========================
class ActivityListView(APIView):
    """
    GET /api/activity/
    Return all activity logs for the current user, ordered by latest first.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get all activities for the current user, ordered by latest first
        activities = ActivityLog.objects.filter(user=request.user).order_by('-timestamp')
        
        # Serialize the data
        serializer = ActivitySerializer(activities, many=True)
        
        return Response(
            {
                'count': activities.count(),
                'activities': serializer.data
            },
            status=status.HTTP_200_OK
        )


# =========================
# BLOCK RULES VIEW (Combined GET/POST)
# =========================
class BlockRulesView(APIView):
    """
    GET /api/block/
    Return all active block rules for the current user.
    
    POST /api/block/
    Create a new block rule for the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all active block rules for the current user."""
        # Get all active block rules for the current user
        rules = BlockRule.objects.filter(
            user=request.user,
            is_active=True
        ).order_by('-created_at')

        serializer = BlockRuleSerializer(rules, many=True)

        return Response(
            {
                'count': rules.count(),
                'rules': serializer.data
            },
            status=status.HTTP_200_OK
        )

    def post(self, request):
        """Create a new block rule for the current user."""
        domain = request.data.get('domain', '').strip()

        # Validate domain input
        if not domain:
            return Response(
                {'error': 'Domain is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Clean domain (remove protocol if present)
        if '://' in domain:
            domain = domain.split('://')[1].split('/')[0].split('?')[0]
        else:
            # Remove query string and path
            domain = domain.split('/')[0].split('?')[0]

        # Remove www. prefix for consistency
        if domain.lower().startswith('www.'):
            domain = domain[4:]
        
        # Final validation - ensure domain is not empty after cleaning
        if not domain:
            return Response(
                {'error': 'Invalid domain format'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if rule already exists for this user
        existing_rule = BlockRule.objects.filter(
            user=request.user,
            domain__iexact=domain,
            is_active=True
        ).first()

        if existing_rule:
            return Response(
                {'error': 'This domain is already blocked'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create new block rule
        block_rule = BlockRule.objects.create(
            user=request.user,
            domain=domain,
            is_active=True
        )

        serializer = BlockRuleSerializer(block_rule)
        return Response(
            {
                'message': 'Block rule created successfully',
                'rule': serializer.data
            },
            status=status.HTTP_201_CREATED
        )


# Backwards compatibility aliases
class ListBlockRulesView(BlockRulesView):
    """Alias for BlockRulesView for backwards compatibility."""
    pass


class CreateBlockRuleView(BlockRulesView):
    """Alias for BlockRulesView for backwards compatibility."""
    pass


# =========================
# DELETE BLOCK RULE VIEW
# =========================
class DeleteBlockRuleView(APIView):
    """
    DELETE /api/block/<id>/
    Delete a block rule by ID (only if it belongs to the current user).
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            block_rule = BlockRule.objects.get(id=pk, user=request.user)
        except BlockRule.DoesNotExist:
            return Response(
                {'error': 'Block rule not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        block_rule.delete()

        return Response(
            {'message': 'Block rule deleted successfully'},
            status=status.HTTP_200_OK
        )


# =========================
# DASHBOARD VIEW
# =========================
class DashboardView(APIView):
    """
    GET /api/dashboard/
    Return dashboard data and statistics for the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get all activity logs for current user
        all_activities = ActivityLog.objects.filter(user=user)
        total_scans = all_activities.count()

        # Count by status
        safe_sites = all_activities.filter(status='safe').count()
        dangerous_sites = all_activities.filter(status='dangerous').count()

        # Count threats blocked (dangerous sites that match block rules)
        user_block_rules = BlockRule.objects.filter(user=user, is_active=True)
        threats_blocked = 0

        for activity in all_activities.filter(status='dangerous'):
            # Check if any of the user's block rules match this dangerous activity
            for rule in user_block_rules:
                if rule.domain.lower() in activity.url.lower():
                    threats_blocked += 1
                    break

        # Calculate safety score
        # Formula: (safe_sites / total_scans) * 100
        # If no scans, return 100 (perfect score)
        if total_scans == 0:
            safety_score = 100
        else:
            safety_score = round((safe_sites / total_scans) * 100)

        # Get recent activity (last 5 scans)
        recent_activities = all_activities.order_by('-timestamp')[:5]
        recent_activity_serializer = ActivitySerializer(recent_activities, many=True)

        return Response(
            {
                'total_scans': total_scans,
                'safe_sites': safe_sites,
                'dangerous_sites': dangerous_sites,
                'threats_blocked': threats_blocked,
                'safety_score': safety_score,
                'recent_activity': recent_activity_serializer.data
            },
            status=status.HTTP_200_OK
        )


# =========================
# CREATE FAMILY VIEW
# =========================
class CreateFamilyView(APIView):
    """
    POST /api/family/create/
    Create a new family (only parent users can create).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Only parents can create families
        if request.user.role != 'parent':
            return Response(
                {'error': 'Only parent users can create families'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if user already has a family
        if request.user.owned_families.exists():
            return Response(
                {'error': 'You already have a family'},
                status=status.HTTP_400_BAD_REQUEST
            )

        family_name = request.data.get('name', '').strip()

        if not family_name:
            return Response(
                {'error': 'Family name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create family with current user as owner
        family = Family.objects.create(
            name=family_name,
            owner=request.user
        )

        # Assign parent to their own family
        request.user.family = family
        request.user.save()

        serializer = FamilySerializer(family)
        return Response(
            {
                'message': 'Family created successfully',
                'family': serializer.data
            },
            status=status.HTTP_201_CREATED
        )


# =========================
# ADD CHILD VIEW
# =========================
class AddChildView(APIView):
    """
    POST /api/family/add-child/
    Add a new child user to parent's family.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Only parents can add children
        if request.user.role != 'parent':
            return Response(
                {'error': 'Only parent users can add children'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if parent has a family
        if not request.user.family:
            return Response(
                {'error': 'You must create a family first'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = AddChildSerializer(data=request.data)

        if serializer.is_valid():
            # Create new child user
            child = serializer.save()
            
            # Assign child to parent's family
            child.family = request.user.family
            child.save()

            child_data = FamilyMemberSerializer(child).data
            return Response(
                {
                    'message': 'Child user added successfully',
                    'child': child_data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =========================
# FAMILY MEMBERS VIEW
# =========================
class FamilyMembersView(APIView):
    """
    GET /api/family/members/
    Return all users in the same family.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Check if user belongs to a family
        if not request.user.family:
            return Response(
                {
                    'count': 0,
                    'members': []
                },
                status=status.HTTP_200_OK
            )

        # Get all members in user's family
        family_members = User.objects.filter(family=request.user.family).order_by('-role')

        serializer = FamilyMemberSerializer(family_members, many=True)

        return Response(
            {
                'count': family_members.count(),
                'family_name': request.user.family.name,
                'members': serializer.data
            },
            status=status.HTTP_200_OK
        )


# =========================
# CHILD ACTIVITY VIEW
# =========================
class ChildActivityView(APIView):
    """
    GET /api/family/child-activity/<child_id>/
    Return activity logs for a specific child (only accessible by parent).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, child_id):
        # Only parents can view child activity
        if request.user.role != 'parent':
            return Response(
                {'error': 'Only parent users can view child activity'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if parent has a family
        if not request.user.family:
            return Response(
                {'error': 'You must create a family first'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the child user
        try:
            child = User.objects.get(id=child_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Child not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verify child belongs to parent's family
        if child.family != request.user.family:
            return Response(
                {'error': 'Unauthorized: Child does not belong to your family'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Verify child has role 'child'
        if child.role != 'child':
            return Response(
                {'error': 'This user is not a child account'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch all activity logs for the child, ordered by latest
        activities = ActivityLog.objects.filter(user=child).order_by('-timestamp')

        serializer = ActivitySerializer(activities, many=True)

        return Response(
            {
                'child_username': child.username,
                'count': activities.count(),
                'activities': serializer.data
            },
            status=status.HTTP_200_OK
        )


# =========================
# ALERTS LIST VIEW
# =========================
class AlertsListView(APIView):
    """
    GET /api/alerts/
    Return all alerts for the authenticated parent user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Only parents can view alerts
        if request.user.role != 'parent':
            return Response(
                {'error': 'Only parent users can view alerts'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get all alerts for this parent
        alerts = Alert.objects.filter(user=request.user).order_by('-created_at')

        serializer = AlertSerializer(alerts, many=True)

        # Count unread alerts
        unread_count = alerts.filter(is_read=False).count()

        return Response(
            {
                'count': alerts.count(),
                'unread_count': unread_count,
                'alerts': serializer.data
            },
            status=status.HTTP_200_OK
        )


# =========================
# MARK ALERT AS READ VIEW
# =========================
class MarkAlertReadView(APIView):
    """
    PATCH /api/alerts/<alert_id>/read/
    Mark a specific alert as read.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, alert_id):
        # Only parents can mark alerts as read
        if request.user.role != 'parent':
            return Response(
                {'error': 'Only parent users can mark alerts as read'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get the alert
        try:
            alert = Alert.objects.get(id=alert_id)
        except Alert.DoesNotExist:
            return Response(
                {'error': 'Alert not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Verify alert belongs to this parent
        if alert.user != request.user:
            return Response(
                {'error': 'Unauthorized: This alert does not belong to you'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Mark as read
        alert.is_read = True
        alert.save()

        serializer = AlertSerializer(alert)

        return Response(
            {
                'message': 'Alert marked as read',
                'alert': serializer.data
            },
            status=status.HTTP_200_OK
        )


# =========================
# DEVICE MANAGEMENT VIEWS
# =========================
class DeviceListView(APIView):
    """
    GET /api/devices/
    Return all devices for the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get all devices for the current user, ordered by most recently active
        devices = Device.objects.filter(user=request.user).order_by('-last_active')
        
        serializer = DeviceSerializer(devices, many=True)
        
        return Response(
            {
                'count': devices.count(),
                'devices': serializer.data
            },
            status=status.HTTP_200_OK
        )


class DeviceRegisterView(APIView):
    """
    POST /api/devices/register/
    Register a new device or update existing device (extension connection).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        device_name = request.data.get('name', '').strip()
        device_type = request.data.get('device_type', 'browser').lower().strip()
        
        # Validate required fields
        if not device_name:
            return Response(
                {'error': 'Device name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if device_type not in ['browser', 'mobile', 'desktop', 'tablet', 'router', 'iot']:
            device_type = 'browser'  # Default to browser
        
        # Get or create device
        device, created = Device.objects.get_or_create(
            user=request.user,
            name=device_name,
            defaults={'device_type': device_type}
        )
        
        # Update last_active timestamp (auto_now=True handles this on save)
        device.save()
        
        serializer = DeviceSerializer(device)
        
        return Response(
            {
                'message': 'Device registered successfully' if created else 'Device updated successfully',
                'device': serializer.data,
                'created': created
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class DeviceUpdateView(APIView):
    """
    PATCH /api/devices/<id>/
    Update a device (name, status, etc).
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, device_id):
        # Get the device
        try:
            device = Device.objects.get(id=device_id, user=request.user)
        except Device.DoesNotExist:
            return Response(
                {'error': 'Device not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update allowed fields
        if 'name' in request.data:
            device.name = request.data.get('name', '').strip()
        
        if 'device_type' in request.data:
            device_type = request.data.get('device_type', '').lower().strip()
            if device_type in ['browser', 'mobile', 'desktop', 'tablet', 'router', 'iot']:
                device.device_type = device_type
        
        if 'status' in request.data:
            status_value = request.data.get('status', '').lower().strip()
            if status_value in ['secure', 'risk']:
                device.status = status_value
        
        device.save()
        
        serializer = DeviceSerializer(device)
        
        return Response(
            {
                'message': 'Device updated successfully',
                'device': serializer.data
            },
            status=status.HTTP_200_OK
        )


class DeviceDetailView(APIView):
    """
    GET /api/devices/<id>/
    Get a specific device details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, device_id):
        try:
            device = Device.objects.get(id=device_id, user=request.user)
        except Device.DoesNotExist:
            return Response(
                {'error': 'Device not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = DeviceSerializer(device)
        
        return Response(serializer.data, status=status.HTTP_200_OK)


class DeviceDeleteView(APIView):
    """
    DELETE /api/devices/<id>/
    Delete a device.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, device_id):
        try:
            device = Device.objects.get(id=device_id, user=request.user)
        except Device.DoesNotExist:
            return Response(
                {'error': 'Device not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        device_name = device.name
        device.delete()
        
        return Response(
            {'message': f'Device "{device_name}" deleted successfully'},
            status=status.HTTP_200_OK
        )


# =========================
# ANALYTICS VIEW
# =========================
class AnalyticsView(APIView):
    """
    GET /api/analytics/
    Return comprehensive analytics and statistics for the current user.
    Includes: total scans, status breakdown, daily activity, and risky domains.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get all activities for current user
        all_activities = ActivityLog.objects.filter(user=user)
        
        # ========================
        # 1. TOTAL COUNTS
        # ========================
        total_scans = all_activities.count()
        safe_count = all_activities.filter(status='safe').count()
        dangerous_count = all_activities.filter(status='dangerous').count()
        suspicious_count = all_activities.filter(status='suspicious').count()
        
        # ========================
        # 2. DAILY ACTIVITY (Last 7 days)
        # ========================
        daily_activity = self._get_daily_activity(all_activities)
        
        # ========================
        # 3. TOP RISKY DOMAINS
        # ========================
        top_risky_domains = self._get_top_risky_domains(all_activities)
        
        # ========================
        # 4. SAFETY SCORE
        # ========================
        safety_score = self._calculate_safety_score(total_scans, safe_count)
        
        # ========================
        # 5. DEVICE BREAKDOWN
        # ========================
        device_breakdown = self._get_device_breakdown(all_activities)
        
        # ========================
        # 6. THREAT CATEGORIES
        # ========================
        threat_categories = self._get_threat_categories(all_activities)
        
        # ========================
        # 7. AVERAGE RISK SCORE
        # ========================
        if total_scans > 0:
            avg_risk_score = round(all_activities.aggregate(avg=Count('risk_score'))['avg'] or 0)
            if all_activities.exists():
                avg_risk_score = round(sum([a.risk_score for a in all_activities]) / total_scans)
        else:
            avg_risk_score = 0
        
        return Response(
            {
                # Summary statistics
                'summary': {
                    'total_scans': total_scans,
                    'safe_count': safe_count,
                    'dangerous_count': dangerous_count,
                    'suspicious_count': suspicious_count,
                    'safety_score': safety_score,
                    'avg_risk_score': avg_risk_score,
                },
                # Daily activity trend
                'daily_activity': daily_activity,
                # Top risky domains
                'top_risky_domains': top_risky_domains,
                # Device breakdown
                'device_breakdown': device_breakdown,
                # Threat categories
                'threat_categories': threat_categories,
            },
            status=status.HTTP_200_OK
        )
    
    def _get_daily_activity(self, activities, days=7):
        """Get daily activity counts for the last N days."""
        daily_data = []
        today = timezone.now().date()
        
        for i in range(days - 1, -1, -1):
            date = today - timedelta(days=i)
            date_start = timezone.make_aware(timezone.datetime.combine(date, timezone.datetime.min.time()))
            date_end = timezone.make_aware(timezone.datetime.combine(date, timezone.datetime.max.time()))
            
            # Get day name
            day_name = date.strftime('%a')
            
            # Count activities for this day by status
            day_activities = activities.filter(
                timestamp__gte=date_start,
                timestamp__lte=date_end
            )
            
            daily_data.append({
                'day': day_name,
                'date': date.isoformat(),
                'total': day_activities.count(),
                'safe': day_activities.filter(status='safe').count(),
                'suspicious': day_activities.filter(status='suspicious').count(),
                'dangerous': day_activities.filter(status='dangerous').count(),
            })
        
        return daily_data
    
    def _get_top_risky_domains(self, activities, limit=10):
        """Get top dangerous/suspicious domains."""
        # Filter for dangerous and suspicious activities
        risky_activities = activities.filter(status__in=['dangerous', 'suspicious'])
        
        # Get unique domains with their max risk score
        domain_dict = {}
        for activity in risky_activities:
            try:
                parsed = urlparse(activity.url)
                domain = parsed.netloc or parsed.path
                
                if domain not in domain_dict:
                    domain_dict[domain] = {
                        'domain': domain,
                        'count': 0,
                        'max_risk': 0,
                        'status': activity.status
                    }
                
                domain_dict[domain]['count'] += 1
                if activity.risk_score > domain_dict[domain]['max_risk']:
                    domain_dict[domain]['max_risk'] = activity.risk_score
                    domain_dict[domain]['status'] = activity.status
            except Exception:
                pass
        
        # Sort by risk score, then by count
        sorted_domains = sorted(
            domain_dict.values(),
            key=lambda x: (x['max_risk'], x['count']),
            reverse=True
        )[:limit]
        
        return sorted_domains
    
    def _calculate_safety_score(self, total_scans, safe_count):
        """Calculate overall safety score (0-100)."""
        if total_scans == 0:
            return 100
        
        score = round((safe_count / total_scans) * 100)
        return min(100, max(0, score))  # Clamp between 0-100
    
    def _get_device_breakdown(self, activities):
        """Get activity count by device."""
        devices = Device.objects.filter(user=self.request.user)
        
        device_data = []
        for device in devices:
            device_activities = activities.filter(device=device)
            device_data.append({
                'device_id': device.id,
                'device_name': device.name,
                'device_type': device.device_type,
                'status': device.status,
                'count': device_activities.count(),
                'dangerous': device_activities.filter(status='dangerous').count(),
                'suspicious': device_activities.filter(status='suspicious').count(),
                'safe': device_activities.filter(status='safe').count(),
            })
        
        # Add "no device" count (for legacy activities without device_id)
        no_device_activities = activities.filter(device__isnull=True)
        if no_device_activities.exists():
            device_data.append({
                'device_id': None,
                'device_name': 'Unknown/Legacy',
                'device_type': 'unknown',
                'status': 'unknown',
                'count': no_device_activities.count(),
                'dangerous': no_device_activities.filter(status='dangerous').count(),
                'suspicious': no_device_activities.filter(status='suspicious').count(),
                'safe': no_device_activities.filter(status='safe').count(),
            })
        
        return device_data
    
    def _get_threat_categories(self, activities):
        """Get threat categories from activity reasons."""
        threat_map = {
            'Phishing': 0,
            'Malware': 0,
            'Tracking': 0,
            'Scam': 0,
            'Adult Content': 0,
            'Other': 0
        }
        
        for activity in activities.filter(status__in=['dangerous', 'suspicious']):
            reason = (activity.reason or '').lower()
            
            if 'phishing' in reason:
                threat_map['Phishing'] += 1
            elif 'malware' in reason:
                threat_map['Malware'] += 1
            elif 'tracking' in reason:
                threat_map['Tracking'] += 1
            elif 'scam' in reason or 'fraud' in reason:
                threat_map['Scam'] += 1
            elif 'adult' in reason:
                threat_map['Adult Content'] += 1
            else:
                threat_map['Other'] += 1
        
        # Convert to list and filter zeros
        threat_categories = [
            {'name': key, 'value': val}
            for key, val in threat_map.items()
            if val > 0
        ]
        
        return sorted(threat_categories, key=lambda x: x['value'], reverse=True)


# =========================
# SETTINGS API VIEWS
# =========================
class SettingsView(APIView):
    """
    GET /api/settings/
    Return current user's settings and profile information.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user settings."""
        serializer = SettingsSerializer(
            request.user, 
            context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class SettingsUpdateView(APIView):
    """
    PATCH /api/settings/update/
    Update user profile information (username, email, profile image).
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        """Update user profile."""
        user = request.user
        
        # Update allowed fields
        if 'username' in request.data:
            new_username = request.data.get('username', '').strip()
            
            if not new_username:
                return Response(
                    {'error': 'Username cannot be empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if username is already taken
            if new_username != user.username and User.objects.filter(username=new_username).exists():
                return Response(
                    {'error': 'Username already taken'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.username = new_username
        
        if 'email' in request.data:
            new_email = request.data.get('email', '').strip()
            
            if not new_email:
                return Response(
                    {'error': 'Email cannot be empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if email is already taken
            if new_email != user.email and User.objects.filter(email=new_email).exists():
                return Response(
                    {'error': 'Email already taken'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.email = new_email
        
        # Handle profile image upload
        if 'profile_image' in request.FILES:
            user.profile_image = request.FILES['profile_image']
        elif 'profile_image' in request.data and request.data.get('profile_image') is None:
            # Allow clearing the image
            user.profile_image = None
        
        user.save()
        
        serializer = SettingsSerializer(
            user, 
            context={'request': request}
        )
        
        return Response(
            {
                'message': 'Profile updated successfully',
                'user': serializer.data
            },
            status=status.HTTP_200_OK
        )


class PasswordChangeView(APIView):
    """
    PATCH /api/settings/password/
    Change user password securely.
    Requires: old_password, new_password, new_password_confirm
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        """Change user password."""
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.save()
            
            return Response(
                {
                    'message': 'Password changed successfully',
                    'user_id': user.id
                },
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PrivacySettingsView(APIView):
    """
    GET /api/settings/privacy/
    Return current privacy settings.
    
    PATCH /api/settings/privacy/
    Update privacy settings (notifications_enabled).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get privacy settings."""
        serializer = PrivacySettingsSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        """Update privacy settings."""
        user = request.user
        
        if 'notifications_enabled' in request.data:
            notifications_enabled = request.data.get('notifications_enabled', True)
            user.notifications_enabled = bool(notifications_enabled)
            user.save()
        
        serializer = PrivacySettingsSerializer(user)
        
        return Response(
            {
                'message': 'Privacy settings updated successfully',
                'settings': serializer.data
            },
            status=status.HTTP_200_OK
        )

