# Generated migration for adding reason field to ActivityLog

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0002_alert'),
    ]

    operations = [
        migrations.AddField(
            model_name='activitylog',
            name='reason',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
