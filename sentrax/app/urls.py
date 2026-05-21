from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    UserProfileView,
    CheckURLView,
    ActivityListView,
    BlockRulesView,
    DeleteBlockRuleView,
    DashboardView,
    CreateFamilyView,
    AddChildView,
    FamilyMembersView,
    ChildActivityView,
    AlertsListView,
    MarkAlertReadView,
    DeviceListView,
    DeviceRegisterView,
    DeviceUpdateView,
    DeviceDetailView,
    DeviceDeleteView,
    AnalyticsView,
    SettingsView,
    SettingsUpdateView,
    PasswordChangeView,
    PrivacySettingsView,
)

urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/user/', UserProfileView.as_view(), name='user-profile'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # URL checking
    path('check-url/', CheckURLView.as_view(), name='check-url'),
    
    # Block rules
    path('block/', BlockRulesView.as_view(), name='block-rules'),  # GET & POST
    path('block/<int:pk>/', DeleteBlockRuleView.as_view(), name='delete-block-rule'),
    
    # Activity
    path('activity/', ActivityListView.as_view(), name='activity-list'),
    
    # Dashboard
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    
    # Analytics
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    
    # Family management
    path('family/create/', CreateFamilyView.as_view(), name='create-family'),
    path('family/add-child/', AddChildView.as_view(), name='add-child'),
    path('family/members/', FamilyMembersView.as_view(), name='family-members'),
    
    # Child activity
    path('child/<int:child_id>/activity/', ChildActivityView.as_view(), name='child-activity'),
    
    # Alerts
    path('alerts/', AlertsListView.as_view(), name='alerts-list'),
    path('alerts/<int:pk>/read/', MarkAlertReadView.as_view(), name='mark-alert-read'),
    
    # Device management
    path('devices/', DeviceListView.as_view(), name='device-list'),
    path('devices/register/', DeviceRegisterView.as_view(), name='device-register'),
    path('devices/<int:device_id>/', DeviceDetailView.as_view(), name='device-detail'),
    path('devices/<int:device_id>/update/', DeviceUpdateView.as_view(), name='device-update'),
    path('devices/<int:device_id>/delete/', DeviceDeleteView.as_view(), name='device-delete'),
    
    # Settings management
    path('settings/', SettingsView.as_view(), name='settings'),
    path('settings/update/', SettingsUpdateView.as_view(), name='settings-update'),
    path('settings/password/', PasswordChangeView.as_view(), name='settings-password'),
    path('settings/privacy/', PrivacySettingsView.as_view(), name='settings-privacy'),
]
