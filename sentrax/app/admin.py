from django.contrib import admin
from .models import User, ActivityLog, Threat, BlockRule, Family, Alert, Device

# Register your models here.

admin.site.register(User)
admin.site.register(ActivityLog)
admin.site.register(Threat)
admin.site.register(BlockRule)
admin.site.register(Family)
admin.site.register(Alert)
admin.site.register(Device)